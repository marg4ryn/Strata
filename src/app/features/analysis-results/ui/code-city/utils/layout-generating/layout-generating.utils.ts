import type { CityNode, ProcessedNode, NodePosition } from '../../code-city.model';

interface LayoutResult {
  positions: NodePosition[];
  totalWidth: number;
  totalDepth: number;
}

export interface SkylineSegment {
  startX: number;
  levelZ: number;
  length: number;
}

interface Placement {
  originX: number;
  originZ: number;
  width: number;
  depth: number;
}

export const PLATFORM_HEIGHT = 1;
export const MIN_PLATFORM_WIDTH = 5;
export const MIN_BUILDING_WIDTH = 0.1;
export const MIN_BUILDING_HEIGHT = 0.1;
export const BUILDING_HEIGHT_SCALE = 30;
export const BUILDING_WIDTH_SCALE = 12;

const MARGIN = 1.5;
const AREA_BUFFER = 1.4;
const MIN_WIDTH_FACTOR = 0.6;
const MAX_WIDTH_FACTOR = 1.4;
const WIDTH_SEARCH_STEPS = 15;
const TARGET_ASPECT_RATIO = 1;
const ASPECT_RATIO_WEIGHT = 100;
const UNUSED_AREA_WEIGHT = 0.5;

const EPSILON = 0.1;

export function processNode(node: CityNode): ProcessedNode {
  // 1. File
  if (node.height !== undefined && node.width !== undefined) {
    const width = (MIN_BUILDING_WIDTH + node.width) * BUILDING_WIDTH_SCALE;
    const height = (MIN_BUILDING_HEIGHT + node.height) * BUILDING_HEIGHT_SCALE;
    return {
      width,
      depth: width,
      height: height,
      children: [],
      positions: [],
    };
  }

  // 2. Empty folder
  if (!node.children || node.children.length === 0) {
    return {
      width: MIN_PLATFORM_WIDTH,
      depth: MIN_PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      children: [],
      positions: [],
    };
  }

  // 3. Folder with children
  const processedChildren = node.children.map(processNode);
  const sortedWithIndex = processedChildren
    .map((child, index) => ({ child, index }))
    .sort((a, b) => b.child.width - a.child.width || b.child.height - a.child.height);

  const sortedChildren = sortedWithIndex.map((item) => item.child);
  const layout = optimizeLayout(sortedChildren);

  const positions = new Array(processedChildren.length);
  layout.positions.forEach((pos, sortedIdx) => {
    positions[sortedWithIndex[sortedIdx].index] = pos;
  });

  return {
    width: layout.totalWidth,
    depth: layout.totalDepth,
    height: PLATFORM_HEIGHT,
    children: processedChildren,
    positions,
  };
}

function optimizeLayout(children: ProcessedNode[]): LayoutResult {
  const occupiedArea = children.reduce(
    (sum, child) => sum + (child.width + MARGIN) * (child.depth + MARGIN),
    0,
  );

  const idealWidth = Math.sqrt(occupiedArea * AREA_BUFFER);
  const minWidth = idealWidth * MIN_WIDTH_FACTOR;
  const maxWidth = idealWidth * MAX_WIDTH_FACTOR;

  let bestLayout: LayoutResult | null = null;
  let bestCost = Infinity;

  for (let i = 0; i <= WIDTH_SEARCH_STEPS; i++) {
    const width = minWidth + (maxWidth - minWidth) * (i / WIDTH_SEARCH_STEPS);

    const layout = calculateSkyline(children, width);

    const aspectRatioDeviation = Math.abs(
      layout.totalWidth / layout.totalDepth - TARGET_ASPECT_RATIO,
    );

    const unusedArea = layout.totalWidth * layout.totalDepth - occupiedArea;

    const cost = aspectRatioDeviation * ASPECT_RATIO_WEIGHT + unusedArea * UNUSED_AREA_WEIGHT;

    if (cost < bestCost) {
      bestCost = cost;
      bestLayout = layout;
    }
  }

  return bestLayout ?? calculateSkyline(children, idealWidth);
}

function calculateSkyline(children: ProcessedNode[], containerWidth: number): LayoutResult {
  const skyline: SkylineSegment[] = [
    { startX: MARGIN, levelZ: MARGIN, length: containerWidth - MARGIN * 2 },
  ];

  const placements: Placement[] = children.map((child) => {
    const widthWithMargin = child.width + MARGIN;
    const depthWithMargin = child.depth + MARGIN;

    const best = findBestPosition(skyline, widthWithMargin, containerWidth);

    const originX = best?.originX ?? MARGIN;
    const originZ = best?.originZ ?? Math.max(...skyline.map((s) => s.levelZ));

    updateSkyline(skyline, originX, originZ + depthWithMargin, widthWithMargin);

    return { originX, originZ, width: child.width, depth: child.depth };
  });

  const minX = Math.min(...placements.map((p) => p.originX));
  const maxX = Math.max(...placements.map((p) => p.originX + p.width));
  const minZ = Math.min(...placements.map((p) => p.originZ));
  const maxZ = Math.max(...placements.map((p) => p.originZ + p.depth));

  const offsetX = MARGIN - minX;
  const offsetZ = MARGIN - minZ;

  return {
    positions: placements.map((p) => ({
      centerX: p.originX + p.width / 2 + offsetX,
      centerZ: p.originZ + p.depth / 2 + offsetZ,
    })),
    totalWidth: maxX - minX + MARGIN * 2,
    totalDepth: maxZ - minZ + MARGIN * 2,
  };
}

export function findBestPosition(
  skyline: SkylineSegment[],
  width: number,
  containerWidth: number,
): { originX: number; originZ: number } | null {
  let best: { originX: number; originZ: number } | null = null;

  for (let startIndex = 0; startIndex < skyline.length; startIndex++) {
    const startSegment = skyline[startIndex];
    if (startSegment.startX + width > containerWidth - MARGIN) continue;

    let spanLength = 0;
    let spanLevelZ = startSegment.levelZ;

    for (let i = startIndex; i < skyline.length && spanLength < width; i++) {
      const isContiguous =
        i === startIndex ||
        Math.abs(skyline[i].startX - (skyline[i - 1].startX + skyline[i - 1].length)) <= EPSILON;

      if (!isContiguous) break;

      spanLength += skyline[i].length;
      spanLevelZ = Math.max(spanLevelZ, skyline[i].levelZ);
    }

    if (spanLength < width) continue;

    const isBetter =
      !best ||
      spanLevelZ < best.originZ ||
      (Math.abs(spanLevelZ - best.originZ) < EPSILON && startSegment.startX < best.originX);

    if (isBetter) {
      best = { originX: startSegment.startX, originZ: spanLevelZ };
    }
  }

  return best;
}

export function updateSkyline(
  skyline: SkylineSegment[],
  startX: number,
  newLevelZ: number,
  length: number,
): void {
  const endX = startX + length;
  const remainingSegments: SkylineSegment[] = [];

  for (const segment of skyline) {
    const segmentEndX = segment.startX + segment.length;
    const isOutside = segmentEndX <= startX + EPSILON || segment.startX >= endX - EPSILON;

    if (isOutside) {
      remainingSegments.push(segment);
      continue;
    }

    const leftRemainderLength = startX - segment.startX;
    if (leftRemainderLength > EPSILON) {
      remainingSegments.push({
        startX: segment.startX,
        levelZ: segment.levelZ,
        length: leftRemainderLength,
      });
    }

    const rightRemainderLength = segmentEndX - endX;
    if (rightRemainderLength > EPSILON) {
      remainingSegments.push({
        startX: endX,
        levelZ: segment.levelZ,
        length: rightRemainderLength,
      });
    }
  }

  remainingSegments.push({ startX, levelZ: newLevelZ, length });
  remainingSegments.sort((a, b) => a.startX - b.startX);

  skyline.length = 0;
  for (const segment of remainingSegments) {
    const previous = skyline[skyline.length - 1];

    const sameLevel = previous && Math.abs(previous.levelZ - segment.levelZ) < EPSILON;
    const adjacent =
      previous && Math.abs(previous.startX + previous.length - segment.startX) < EPSILON;

    if (sameLevel && adjacent) {
      previous.length += segment.length;
    } else {
      skyline.push(segment);
    }
  }
}
