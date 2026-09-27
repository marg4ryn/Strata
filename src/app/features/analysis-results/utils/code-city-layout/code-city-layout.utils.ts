import type { CityNode } from '../../analysis-results.model';

export interface ProcessedNode {
  width: number;
  depth: number;
  height: number;
  children: ProcessedNode[];
  positions: NodePosition[];
}

interface NodePosition {
  x: number;
  z: number;
  rowDepth: number;
}

interface LayoutResult {
  positions: NodePosition[];
  totalWidth: number;
  totalDepth: number;
}

interface SkylineSegment {
  x: number;
  z: number;
  width: number;
}

const PLATFORM_HEIGHT = 1;
const MIN_PLATFORM_WIDTH = 5;
const MIN_BUILDING_WIDTH = 0.1;
const MIN_BUILDING_HEIGHT = 0.1;
const BUILDING_HEIGHT_SCALE = 30;
const BUILDING_WIDTH_SCALE = 12;

const MARGIN = 1.5;
const AREA_BUFFER = 1.4;
const MIN_WIDTH_FACTOR = 0.6;
const MAX_WIDTH_FACTOR = 1.4;
const WIDTH_SEARCH_STEPS = 15;
const TARGET_ASPECT_RATIO = 1;
const ASPECT_RATIO_WEIGHT = 100;
const UNUSED_AREA_WEIGHT = 0.1;

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

  // Sort elements starting with the largest to ensure better packing by the Skyline algorithm.
  // Store the original indices to maintain the consistency of parallel arrays
  // after the layout is calculated: the index in node.children must correspond to the index in node.positions.
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
  if (children.length === 0) {
    return { positions: [], totalWidth: MARGIN * 2, totalDepth: MARGIN * 2 };
  }

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
  const skyline: SkylineSegment[] = [{ x: MARGIN, z: MARGIN, width: containerWidth - MARGIN * 2 }];

  const placements = children.map((child) => {
    const widthWithMargin = child.width + MARGIN;
    const depthWithMargin = child.depth + MARGIN;

    const placement = findBestPosition(skyline, widthWithMargin, containerWidth);

    const x = placement?.x ?? MARGIN;
    const z = placement?.z ?? Math.max(...skyline.map((segment) => segment.z + MARGIN));

    updateSkyline(skyline, x, z + depthWithMargin, widthWithMargin);

    return {
      x,
      z,
      width: child.width,
      depth: child.depth,
      rowDepth: depthWithMargin,
    };
  });

  const minX = Math.min(...placements.map((p) => p.x));
  const maxX = Math.max(...placements.map((p) => p.x + p.width));
  const minZ = Math.min(...placements.map((p) => p.z));
  const maxZ = Math.max(...placements.map((p) => p.z + p.depth));

  const offsetX = MARGIN - minX;
  const offsetZ = MARGIN - minZ;

  return {
    positions: placements.map((p) => ({
      x: p.x + p.width / 2 + offsetX,
      z: p.z + p.depth / 2 + offsetZ,
      rowDepth: p.rowDepth,
    })),
    totalWidth: maxX - minX + MARGIN * 2,
    totalDepth: maxZ - minZ + MARGIN * 2,
  };
}

function findBestPosition(
  skyline: SkylineSegment[],
  width: number,
  containerWidth: number,
): { x: number; z: number } | null {
  let best: { x: number; z: number } | null = null;

  for (let startIndex = 0; startIndex < skyline.length; startIndex++) {
    const startSegment = skyline[startIndex];
    if (startSegment.x + width > containerWidth - MARGIN) continue;

    let spanWidth = 0;
    let spanHeight = startSegment.z;

    for (let i = startIndex; i < skyline.length && spanWidth < width; i++) {
      const isContiguous =
        i === startIndex ||
        Math.abs(skyline[i].x - (skyline[i - 1].x + skyline[i - 1].width)) <= EPSILON;

      if (!isContiguous) break;

      spanWidth += skyline[i].width;
      spanHeight = Math.max(spanHeight, skyline[i].z);
    }

    if (spanWidth < width) continue;

    const isBetter =
      !best || spanHeight < best.z || (spanHeight === best.z && startSegment.x < best.x);

    if (isBetter) {
      best = { x: startSegment.x, z: spanHeight };
    }
  }

  return best;
}

function updateSkyline(skyline: SkylineSegment[], x: number, newZ: number, width: number): void {
  const endX = x + width;
  const remainingSegments: SkylineSegment[] = [];

  for (const segment of skyline) {
    const segmentEndX = segment.x + segment.width;
    const isOutside = segmentEndX <= x + EPSILON || segment.x >= endX - EPSILON;

    if (isOutside) {
      remainingSegments.push(segment);
      continue;
    }

    const leftRemainderWidth = x - segment.x;
    if (leftRemainderWidth > EPSILON) {
      remainingSegments.push({ x: segment.x, z: segment.z, width: leftRemainderWidth });
    }

    const rightRemainderWidth = segmentEndX - endX;
    if (rightRemainderWidth > EPSILON) {
      remainingSegments.push({ x: endX, z: segment.z, width: rightRemainderWidth });
    }
  }

  remainingSegments.push({ x, z: newZ, width });
  remainingSegments.sort((a, b) => a.x - b.x);

  skyline.length = 0;
  for (const segment of remainingSegments) {
    const previous = skyline[skyline.length - 1];

    const sameHeight = previous && Math.abs(previous.z - segment.z) < EPSILON;
    const adjacent = previous && Math.abs(previous.x + previous.width - segment.x) < EPSILON;

    if (sameHeight && adjacent) {
      previous.width += segment.width;
    } else {
      skyline.push(segment);
    }
  }
}
