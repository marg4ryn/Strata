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

/* ------------------------------------------------------------------ */
/* Genetic algorithm: parameters and options                           */
/* ------------------------------------------------------------------ */

export interface GAParams {
  populationSize: number;
  generations: number;
  crossoverProbability: number;
  mutationProbability: number;
  tournamentSize: number;
  /** Stop early after this many generations without improvement. */
  stagnationLimit: number;
}

export const DEFAULT_GA_PARAMS: GAParams = {
  populationSize: 20,
  generations: 40,
  crossoverProbability: 0.8,
  mutationProbability: 0.1,
  tournamentSize: 3,
  stagnationLimit: 15,
};

export interface GAReport {
  childCount: number;
  baselineCost: number;
  gaCost: number;
  /** Best cost per generation (for comparing parameter sets). */
  history: number[];
}

export interface LayoutOptions {
  useGA: boolean;
  ga: GAParams;
  seed: number;
  /** GA runs only if the skyline layout wastes more than this share of area. */
  minUnusedRatioForGA: number;
  /** Stretch folder platforms into free space next to them (files stay square). */
  stretchFolders: boolean;
  onGAResult?: (report: GAReport) => void;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  useGA: true,
  ga: DEFAULT_GA_PARAMS,
  seed: 1,
  minUnusedRatioForGA: 0.2,
  stretchFolders: true,
};

type Rng = () => number;

/** Seeded PRNG (mulberry32) - same repo gives the same city. */
function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Node processing                                                     */
/* ------------------------------------------------------------------ */

export function processNode(
  node: CityNode,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
  rng: Rng = createRng(options.seed),
): ProcessedNode {
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
  const processed = node.children.map((child) => processNode(child, options, rng));

  const baseline = finalizeLayout(processed, layoutBaseline(processed), options.stretchFolders);
  const baselineOccupied = occupiedArea(baseline.children);
  const baselineCost = layoutCost(baseline.layout, baselineOccupied);
  let { children, layout } = baseline;

  const wastedRatio = unusedRatio(layout, baselineOccupied);
  if (options.useGA && processed.length >= 2 && wastedRatio > options.minUnusedRatioForGA) {
    const ga = runGeneticAlgorithm(processed, options.ga, rng, options.stretchFolders);
    options.onGAResult?.({
      childCount: children.length,
      baselineCost,
      gaCost: ga.cost,
      history: ga.history,
    });
    if (ga.cost < baselineCost) {
      children = ga.children;
      layout = ga.layout;
    }
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
/* Cost (fitness = 1 / (1 + cost))                                     */
/* ------------------------------------------------------------------ */

function occupiedArea(children: ProcessedNode[]): number {
  return children.reduce((sum, child) => sum + (child.width + MARGIN) * (child.depth + MARGIN), 0);
}

function unusedRatio(layout: LayoutResult, occupied: number): number {
  const area = layout.totalWidth * layout.totalDepth;
  return area > 0 ? (area - occupied) / area : 0;
}

function layoutCost(layout: LayoutResult, occupied: number): number {
  const aspectRatioDeviation = Math.abs(
    layout.totalWidth / layout.totalDepth - TARGET_ASPECT_RATIO,
  );
  const unusedArea = layout.totalWidth * layout.totalDepth - occupied;
  return aspectRatioDeviation * ASPECT_RATIO_WEIGHT + unusedArea * UNUSED_AREA_WEIGHT;
}

/* ------------------------------------------------------------------ */
/* Baseline: original skyline with width sweep                         */
/* ------------------------------------------------------------------ */

function sortedBySize(children: ProcessedNode[]): { child: ProcessedNode; index: number }[] {
  return children
    .map((child, index) => ({ child, index }))
    .sort((a, b) => b.child.width - a.child.width || b.child.height - a.child.height);
}

/** Returns positions in the ORIGINAL order of `children`. */
function layoutBaseline(children: ProcessedNode[]): LayoutResult {
  const sorted = sortedBySize(children);
  const layout = optimizeLayout(sorted.map((s) => s.child));
  const positions: NodePosition[] = new Array(children.length);
  layout.positions.forEach((pos, sortedIdx) => {
    positions[sorted[sortedIdx].index] = pos;
  });
  return { ...layout, positions };
}

function optimizeLayout(children: ProcessedNode[]): LayoutResult {
  const occupied = occupiedArea(children);

  const idealWidth = Math.sqrt(occupied * AREA_BUFFER);
  const minWidth = idealWidth * MIN_WIDTH_FACTOR;
  const maxWidth = idealWidth * MAX_WIDTH_FACTOR;

  let bestLayout: LayoutResult | null = null;
  let bestCost = Infinity;

  for (let i = 0; i <= WIDTH_SEARCH_STEPS; i++) {
    const width = minWidth + (maxWidth - minWidth) * (i / WIDTH_SEARCH_STEPS);
    const layout = calculateSkyline(children, width);
    const cost = layoutCost(layout, occupied);

    if (cost < bestCost) {
      bestCost = cost;
      bestLayout = layout;
    }
  }

  return bestLayout ?? calculateSkyline(children, idealWidth);
}

/* ------------------------------------------------------------------ */
/* Stretching folders into free space                                  */
/* ------------------------------------------------------------------ */

interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

// Files are at least MIN_BUILDING_HEIGHT * BUILDING_HEIGHT_SCALE = 3 tall, platforms are 1.
const isFolder = (node: ProcessedNode) => node.height === PLATFORM_HEIGHT;

/** Enlarges a platform; its content stays centered. */
function stretchNode(node: ProcessedNode, width: number, depth: number): ProcessedNode {
  const dx = (width - node.width) / 2;
  const dz = (depth - node.depth) / 2;
  return {
    ...node,
    width,
    depth,
    positions: node.positions.map((p) => ({ centerX: p.centerX + dx, centerZ: p.centerZ + dz })),
  };
}

function finalizeLayout(
  children: ProcessedNode[],
  layout: LayoutResult,
  stretch: boolean,
): { children: ProcessedNode[]; layout: LayoutResult } {
  return stretch ? expandFolders(children, layout) : { children, layout };
}

/**
 * Greedily grows every folder platform (smallest first) in all four directions
 * until it hits a neighbour (keeping MARGIN) or the container edge. A small
 * folder next to a big one is thus stretched to the big one's size.
 */
function expandFolders(
  children: ProcessedNode[],
  layout: LayoutResult,
): { children: ProcessedNode[]; layout: LayoutResult } {
  const rects: Rect[] = children.map((c, i) => ({
    x0: layout.positions[i].centerX - c.width / 2,
    x1: layout.positions[i].centerX + c.width / 2,
    z0: layout.positions[i].centerZ - c.depth / 2,
    z1: layout.positions[i].centerZ + c.depth / 2,
  }));

  const minX = MARGIN;
  const maxX = layout.totalWidth - MARGIN;
  const minZ = MARGIN;
  const maxZ = layout.totalDepth - MARGIN;

  // projections that are closer than MARGIN block each other
  const sharesX = (a: Rect, b: Rect) =>
    a.x0 < b.x1 + MARGIN - EPSILON && b.x0 < a.x1 + MARGIN - EPSILON;
  const sharesZ = (a: Rect, b: Rect) =>
    a.z0 < b.z1 + MARGIN - EPSILON && b.z0 < a.z1 + MARGIN - EPSILON;

  const folderIndices = children
    .map((_, i) => i)
    .filter((i) => isFolder(children[i]))
    .sort((a, b) => children[a].width * children[a].depth - children[b].width * children[b].depth);

  for (const i of folderIndices) {
    const r = rects[i];

    let limit = maxX;
    for (let j = 0; j < rects.length; j++) {
      if (j !== i && sharesZ(r, rects[j]) && rects[j].x0 >= r.x1 - EPSILON) {
        limit = Math.min(limit, rects[j].x0 - MARGIN);
      }
    }
    r.x1 = Math.max(r.x1, limit);

    limit = minX;
    for (let j = 0; j < rects.length; j++) {
      if (j !== i && sharesZ(r, rects[j]) && rects[j].x1 <= r.x0 + EPSILON) {
        limit = Math.max(limit, rects[j].x1 + MARGIN);
      }
    }
    r.x0 = Math.min(r.x0, limit);

    limit = maxZ;
    for (let j = 0; j < rects.length; j++) {
      if (j !== i && sharesX(r, rects[j]) && rects[j].z0 >= r.z1 - EPSILON) {
        limit = Math.min(limit, rects[j].z0 - MARGIN);
      }
    }
    r.z1 = Math.max(r.z1, limit);

    limit = minZ;
    for (let j = 0; j < rects.length; j++) {
      if (j !== i && sharesX(r, rects[j]) && rects[j].z1 <= r.z0 + EPSILON) {
        limit = Math.max(limit, rects[j].z1 + MARGIN);
      }
    }
    r.z0 = Math.min(r.z0, limit);
  }

  const stretched = children.map((c, i) => {
    const width = rects[i].x1 - rects[i].x0;
    const depth = rects[i].z1 - rects[i].z0;
    return width - c.width > EPSILON || depth - c.depth > EPSILON
      ? stretchNode(c, Math.max(width, c.width), Math.max(depth, c.depth))
      : c;
  });

  return {
    children: stretched,
    layout: {
      totalWidth: layout.totalWidth,
      totalDepth: layout.totalDepth,
      positions: rects.map((r) => ({ centerX: (r.x0 + r.x1) / 2, centerZ: (r.z0 + r.z1) / 2 })),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Genetic algorithm                                                   */
/* ------------------------------------------------------------------ */

/**
 * Target width/depth ratios a folder can be reshaped to. Files stay square,
 * folders keep their children rigid and are only re-packed into another shape.
 */
const SHAPE_RATIOS = [0.35, 0.5, 0.7, 1, 1.4, 2, 2.85];
const DEFAULT_SHAPE = 3; // ratio 1 = the folder as already computed

interface Chromosome {
  /** Permutation of child indices: order in which children enter the skyline. */
  order: number[];
  /** Per child: index into SHAPE_RATIOS (ignored for files / empty folders). */
  shape: number[];
  /** Level 2: subShape[i][j] = shape of the j-th child of child i (if that is a folder). */
  subShape: number[][];
  /** Container width multiplier in [MIN_WIDTH_FACTOR, MAX_WIDTH_FACTOR]. */
  widthFactor: number;
}

interface Evaluated {
  chromosome: Chromosome;
  cost: number;
  fitness: number;
  children: ProcessedNode[];
  layout: LayoutResult;
}

/**
 * Re-packs a folder's children into a different aspect ratio.
 * With `subShapes` the folder's own child folders are reshaped first (level 2);
 * their children stay rigid.
 */
function reshape(node: ProcessedNode, ratio: number, subShapes?: number[]): ProcessedNode {
  const children = node.children.map((child, j) => {
    const k = subShapes?.[j] ?? DEFAULT_SHAPE;
    return k === DEFAULT_SHAPE || child.children.length === 0
      ? child
      : reshape(child, SHAPE_RATIOS[k]);
  });

  const sorted = sortedBySize(children);
  const sortedChildren = sorted.map((s) => s.child);
  const area = occupiedArea(sortedChildren);
  const layout = calculateSkyline(sortedChildren, Math.sqrt(area * AREA_BUFFER * ratio));

  const positions: NodePosition[] = new Array(children.length);
  layout.positions.forEach((pos, sortedIdx) => {
    positions[sorted[sortedIdx].index] = pos;
  });

  return { ...node, width: layout.totalWidth, depth: layout.totalDepth, children, positions };
}

function runGeneticAlgorithm(
  original: ProcessedNode[],
  params: GAParams,
  rng: Rng,
  stretch: boolean,
): { children: ProcessedNode[]; layout: LayoutResult; cost: number; history: number[] } {
  const n = original.length;
  const reshapable = original.map((c) => c.children.length > 0);

  // Lazily computed variants, keyed by child + level-1 shape + level-2 shapes
  const variantCache = new Map<string, ProcessedNode>();
  const variantOf = (i: number, k: number, sub: number[]): ProcessedNode => {
    if (!reshapable[i]) return original[i];
    if (k === DEFAULT_SHAPE && sub.every((s) => s === DEFAULT_SHAPE)) return original[i];
    const key = `${i}|${k}|${sub.join(',')}`;
    let variant = variantCache.get(key);
    if (!variant) {
      variant = reshape(original[i], SHAPE_RATIOS[k], sub);
      variantCache.set(key, variant);
    }
    return variant;
  };

  const randInt = (max: number) => Math.floor(rng() * max);
  const randomShape = (i: number) => (reshapable[i] ? randInt(SHAPE_RATIOS.length) : DEFAULT_SHAPE);
  const randomSubShape = (i: number, j: number) =>
    original[i].children[j].children.length > 0 ? randInt(SHAPE_RATIOS.length) : DEFAULT_SHAPE;
  const defaultSub = () => original.map((c) => c.children.map(() => DEFAULT_SHAPE));
  const clampWidth = (w: number) => Math.min(MAX_WIDTH_FACTOR, Math.max(MIN_WIDTH_FACTOR, w));

  const gaussian = () => {
    const u = Math.max(rng(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  };

  /* ---- decoding + fitness ---- */
  const evaluate = (chromosome: Chromosome): Evaluated => {
    const children = original.map((_, i) =>
      variantOf(i, chromosome.shape[i], chromosome.subShape[i]),
    );
    const placed = chromosome.order.map((i) => children[i]);
    const occupied = occupiedArea(placed);
    const containerWidth = Math.sqrt(occupied * AREA_BUFFER) * chromosome.widthFactor;

    const raw = calculateSkyline(placed, containerWidth);
    const positions: NodePosition[] = new Array(n);
    raw.positions.forEach((pos, k) => {
      positions[chromosome.order[k]] = pos;
    });
    const final = finalizeLayout(children, { ...raw, positions }, stretch);

    // stretched platforms count as occupied, so the GA is rewarded for filling gaps
    const cost = layoutCost(final.layout, occupiedArea(final.children));
    return {
      chromosome,
      cost,
      fitness: 1 / (1 + cost),
      children: final.children,
      layout: final.layout,
    };
  };

  /* ---- initialization ---- */
  const identityOrder = sortedBySize(original).map((s) => s.index);

  const randomChromosome = (): Chromosome => {
    const order = [...identityOrder];
    for (let i = n - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      order,
      shape: original.map((_, i) => randomShape(i)),
      subShape: original.map((c, i) => c.children.map((_, j) => randomSubShape(i, j))),
      widthFactor: MIN_WIDTH_FACTOR + rng() * (MAX_WIDTH_FACTOR - MIN_WIDTH_FACTOR),
    };
  };

  let population: Evaluated[] = [
    // one individual equals the plain "largest first" skyline
    evaluate({
      order: [...identityOrder],
      shape: original.map(() => DEFAULT_SHAPE),
      subShape: defaultSub(),
      widthFactor: 1,
    }),
  ];
  while (population.length < params.populationSize) {
    population.push(evaluate(randomChromosome()));
  }

  /* ---- operators ---- */
  const tournament = (): Evaluated => {
    let best = population[randInt(population.length)];
    for (let i = 1; i < params.tournamentSize; i++) {
      const candidate = population[randInt(population.length)];
      if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
  };

  // One-point crossover over genes [shape_0..shape_n-1, widthFactor];
  // the permutation uses the same cut point with repair.
  const crossover = (a: Chromosome, b: Chromosome): [Chromosome, Chromosome] => {
    const cut = 1 + randInt(n); // 1..n  (n => only widthFactor is swapped)
    const make = (p1: Chromosome, p2: Chromosome): Chromosome => {
      const prefix = p1.order.slice(0, Math.min(cut, n));
      const used = new Set(prefix);
      return {
        order: [...prefix, ...p2.order.filter((x) => !used.has(x))],
        shape: [...p1.shape.slice(0, cut), ...p2.shape.slice(cut)],
        subShape: [
          ...p1.subShape.slice(0, cut).map((s) => [...s]),
          ...p2.subShape.slice(cut).map((s) => [...s]),
        ],
        widthFactor: p2.widthFactor,
      };
    };
    return [make(a, b), make(b, a)];
  };

  const mutate = (c: Chromosome): Chromosome => {
    const order = [...c.order];
    const shape = [...c.shape];
    const subShape = c.subShape.map((s) => [...s]);
    let widthFactor = c.widthFactor;

    for (let i = 0; i < n; i++) {
      if (reshapable[i] && rng() < params.mutationProbability) shape[i] = randomShape(i);
      for (let j = 0; j < subShape[i].length; j++) {
        if (rng() < params.mutationProbability) subShape[i][j] = randomSubShape(i, j);
      }
    }
    if (n > 1 && rng() < params.mutationProbability) {
      const i = randInt(n);
      const j = randInt(n);
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (rng() < params.mutationProbability) {
      widthFactor = clampWidth(widthFactor * Math.exp(gaussian() * 0.15));
    }
    return { order, shape, subShape, widthFactor };
  };

  /* ---- main loop ---- */
  const bestOf = (pop: Evaluated[]) => pop.reduce((a, b) => (b.fitness > a.fitness ? b : a));

  let best = bestOf(population);
  const history: number[] = [best.cost];
  let stagnation = 0;

  for (let gen = 0; gen < params.generations && stagnation < params.stagnationLimit; gen++) {
    const next: Evaluated[] = [best]; // elitism

    while (next.length < params.populationSize) {
      const a = tournament().chromosome;
      const b = tournament().chromosome;
      const [c1, c2] = rng() < params.crossoverProbability ? crossover(a, b) : [a, b];
      next.push(evaluate(mutate(c1)));
      if (next.length < params.populationSize) next.push(evaluate(mutate(c2)));
    }

    population = next;
    const generationBest = bestOf(population);
    stagnation = generationBest.cost < best.cost - 1e-9 ? 0 : stagnation + 1;
    if (generationBest.fitness > best.fitness) best = generationBest;
    history.push(best.cost);
  }

  return { children: best.children, layout: best.layout, cost: best.cost, history };
}

/* ------------------------------------------------------------------ */
/* Skyline (decoder) - unchanged                                       */
/* ------------------------------------------------------------------ */

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
