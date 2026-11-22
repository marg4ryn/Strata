import type { CityNode, ProcessedNode, NodePosition } from '../../code-city.model';

export const PLATFORM_HEIGHT = 1;
export const MIN_PLATFORM_WIDTH = 5;
export const MIN_BUILDING_WIDTH = 0.1;
export const MIN_BUILDING_HEIGHT = 0.1;
export const BUILDING_HEIGHT_SCALE = 30;
export const BUILDING_WIDTH_SCALE = 12;

const MARGIN = 1.5;
const ASPECT_RATIO_WEIGHT = 0.2;
const WIDTH_FACTORS = [0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
const EPSILON = 1e-6;

export interface LayoutOptions {
  rotateFolders: boolean;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  rotateFolders: true,
};

interface LayoutResult {
  positions: NodePosition[];
  totalWidth: number;
  totalDepth: number;
}

/* ------------------------------------------------------------------ */
/* Node processing                                                     */
/* ------------------------------------------------------------------ */

export function processNode(
  node: CityNode,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): ProcessedNode {
  // 1. File
  if (node.height !== undefined && node.width !== undefined) {
    const width = (MIN_BUILDING_WIDTH + node.width) * BUILDING_WIDTH_SCALE;
    return {
      width,
      depth: width,
      height: (MIN_BUILDING_HEIGHT + node.height) * BUILDING_HEIGHT_SCALE,
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
  let children = node.children.map((child) => processNode(child, options));
  let layout = pack(children);

  if (options.rotateFolders) {
    ({ children, layout } = improveByRotation(children, layout));
  }

  return {
    width: layout.totalWidth,
    depth: layout.totalDepth,
    height: PLATFORM_HEIGHT,
    children,
    positions: layout.positions,
  };
}

/* ------------------------------------------------------------------ */
/* Packing                                                             */
/* ------------------------------------------------------------------ */

interface Box {
  w: number;
  h: number;
  x: number;
  y: number;
  index: number;
}

interface Space {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Packs children into a platform, trying several container widths and keeping
 * the cheapest result. Every box carries MARGIN on its right and bottom side,
 * so only the left/top margin is added afterwards.
 * Positions are returned in the original order of `children`.
 */
function pack(children: ProcessedNode[]): LayoutResult {
  const boxes: Box[] = children
    .map((c, index) => ({ w: c.width + MARGIN, h: c.depth + MARGIN, x: 0, y: 0, index }))
    .sort((a, b) => b.h - a.h || b.w - a.w);

  const area = boxes.reduce((sum, b) => sum + b.w * b.h, 0);
  const maxBoxWidth = Math.max(...boxes.map((b) => b.w));
  const idealWidth = Math.sqrt(area / 0.95);

  // the first width is the fallback when costs are not finite (e.g. NaN sizes)
  let best = packAtWidth(children, boxes, Math.max(idealWidth * WIDTH_FACTORS[0], maxBoxWidth));
  let bestCost = layoutCost(best);
  for (const factor of WIDTH_FACTORS.slice(1)) {
    const layout = packAtWidth(children, boxes, Math.max(idealWidth * factor, maxBoxWidth));
    const cost = layoutCost(layout);
    if (cost < bestCost) {
      best = layout;
      bestCost = cost;
    }
  }
  return best;
}

/**
 * potpack's algorithm (github.com/mapbox/potpack) with a configurable width:
 * boxes, tallest first, go into the top-left corner of the smallest free space
 * that fits them; the space is then split in two (guillotine cut).
 */
function packAtWidth(children: ProcessedNode[], boxes: Box[], width: number): LayoutResult {
  const spaces: Space[] = [{ x: 0, y: 0, w: width, h: Infinity }];
  let usedWidth = 0;
  let usedDepth = 0;

  for (const box of boxes) {
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];
      if (box.w > space.w + EPSILON || box.h > space.h + EPSILON) continue;

      box.x = space.x;
      box.y = space.y;
      usedWidth = Math.max(usedWidth, box.x + box.w);
      usedDepth = Math.max(usedDepth, box.y + box.h);

      const fitsWidth = Math.abs(box.w - space.w) < EPSILON;
      const fitsDepth = Math.abs(box.h - space.h) < EPSILON;
      if (fitsWidth && fitsDepth) {
        spaces.splice(i, 1);
      } else if (fitsDepth) {
        space.x += box.w;
        space.w -= box.w;
      } else if (fitsWidth) {
        space.y += box.h;
        space.h -= box.h;
      } else {
        spaces.push({ x: space.x + box.w, y: space.y, w: space.w - box.w, h: box.h });
        space.y += box.h;
        space.h -= box.h;
      }
      break;
    }
  }

  const positions: NodePosition[] = new Array(children.length);
  for (const box of boxes) {
    const child = children[box.index];
    positions[box.index] = {
      centerX: MARGIN + box.x + child.width / 2,
      centerZ: MARGIN + box.y + child.depth / 2,
    };
  }
  return { positions, totalWidth: usedWidth + MARGIN, totalDepth: usedDepth + MARGIN };
}

function layoutCost(layout: LayoutResult): number {
  const area = layout.totalWidth * layout.totalDepth;
  return (
    area * (1 + ASPECT_RATIO_WEIGHT * Math.abs(Math.log(layout.totalWidth / layout.totalDepth)))
  );
}

/* ------------------------------------------------------------------ */
/* Rotating folders                                                    */
/* ------------------------------------------------------------------ */

/** Rotates a node by 90° together with its whole subtree. Squares are returned as is. */
function rotate(node: ProcessedNode): ProcessedNode {
  if (Math.abs(node.width - node.depth) < EPSILON) return node;
  return {
    ...node,
    width: node.depth,
    depth: node.width,
    children: node.children.map(rotate),
    positions: node.positions.map((p) => ({ centerX: node.depth - p.centerZ, centerZ: p.centerX })),
  };
}

/**
 * Greedy pass: for every non-square child folder (largest first) try the rotated
 * variant and keep it if the packed parent gets cheaper.
 */
function improveByRotation(
  children: ProcessedNode[],
  layout: LayoutResult,
): { children: ProcessedNode[]; layout: LayoutResult } {
  let bestCost = layoutCost(layout);

  const candidates = children
    .map((c, i) => i)
    .filter((i) => Math.abs(children[i].width - children[i].depth) > EPSILON)
    .sort((a, b) => children[b].width * children[b].depth - children[a].width * children[a].depth);

  for (const i of candidates) {
    const trial = [...children];
    trial[i] = rotate(children[i]);
    const trialLayout = pack(trial);
    const cost = layoutCost(trialLayout);
    if (cost < bestCost - EPSILON) {
      children = trial;
      layout = trialLayout;
      bestCost = cost;
    }
  }

  return { children, layout };
}
