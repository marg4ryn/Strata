import type { CityNode } from '../../../../analysis-results.model';
import {
  findBestPosition,
  processNode,
  updateSkyline,
  MIN_BUILDING_HEIGHT,
  MIN_BUILDING_WIDTH,
  BUILDING_HEIGHT_SCALE,
  BUILDING_WIDTH_SCALE,
  MIN_PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
} from './layout.utils';
import type { SkylineSegment, ProcessedNode } from './layout.utils';

function makeCityNode(overrides: Partial<CityNode>): CityNode {
  return {
    name: 'test',
    type: 'file',
    path: '/test',
    ...overrides,
  } as CityNode;
}

function assertNoOverlap(result: ProcessedNode) {
  const rects = result.children.map((child, i) => {
    const pos = result.positions[i];
    return {
      minX: pos.x - child.width / 2,
      maxX: pos.x + child.width / 2,
      minZ: pos.z - child.depth / 2,
      maxZ: pos.z + child.depth / 2,
    };
  });

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const overlapsX = a.minX < b.maxX && b.minX < a.maxX;
      const overlapsZ = a.minZ < b.maxZ && b.minZ < a.maxZ;
      expect(overlapsX && overlapsZ).toBe(false);
    }
  }
}

describe('processNode', () => {
  describe('file node', () => {
    it('calculates dimensions from scaled source values', () => {
      const node = makeCityNode({ width: 10, height: 20 });

      const result = processNode(node);

      expect(result.width).toBe((MIN_BUILDING_WIDTH + 10) * BUILDING_WIDTH_SCALE);
      expect(result.height).toBe((MIN_BUILDING_HEIGHT + 20) * BUILDING_HEIGHT_SCALE);
      expect(result.depth).toBe(result.width);
    });

    it('returns no children or positions', () => {
      const node = makeCityNode({ width: 1, height: 1 });

      const result = processNode(node);

      expect(result.children).toEqual([]);
      expect(result.positions).toEqual([]);
    });

    it('uses minimum dimensions for zero width and height', () => {
      const node = makeCityNode({ width: 0, height: 0 });

      const result = processNode(node);

      expect(result.width).toBe(MIN_BUILDING_WIDTH * BUILDING_WIDTH_SCALE);
      expect(result.height).toBe(MIN_BUILDING_HEIGHT * BUILDING_HEIGHT_SCALE);
    });
  });

  describe('empty directory node', () => {
    it('returns minimum platform dimensions', () => {
      const node = makeCityNode({ type: 'dir', children: [] });

      const result = processNode(node);

      expect(result.width).toBe(MIN_PLATFORM_WIDTH);
      expect(result.depth).toBe(MIN_PLATFORM_WIDTH);
      expect(result.height).toBe(PLATFORM_HEIGHT);
      expect(result.children).toEqual([]);
      expect(result.positions).toEqual([]);
    });

    it('treats a missing children field as an empty list', () => {
      const node = makeCityNode({ type: 'dir' });

      const result = processNode(node);

      expect(result.width).toBe(MIN_PLATFORM_WIDTH);
    });
  });

  describe('directory node with children', () => {
    it('preserves child order in positions after internal sorting', () => {
      const node = makeCityNode({
        type: 'dir',
        children: [
          makeCityNode({ width: 1, height: 1 }),
          makeCityNode({ width: 10, height: 10 }),
          makeCityNode({ width: 5, height: 5 }),
        ],
      });

      const result = processNode(node);

      expect(result.positions).toHaveLength(3);
      expect(result.positions.every((p) => p !== undefined)).toBe(true);
      expect(typeof result.positions[1].x).toBe('number');
      expect(typeof result.positions[1].z).toBe('number');
    });

    it('places children without overlap', () => {
      const node = makeCityNode({
        type: 'dir',
        children: [
          makeCityNode({ width: 2, height: 1 }),
          makeCityNode({ width: 4, height: 1 }),
          makeCityNode({ width: 1, height: 1 }),
          makeCityNode({ width: 3, height: 1 }),
        ],
      });

      const result = processNode(node);

      assertNoOverlap(result);
    });

    it('keeps platform height independent of child dimensions', () => {
      const node = makeCityNode({
        type: 'dir',
        children: [makeCityNode({ width: 5, height: 100 })],
      });

      const result = processNode(node);

      expect(result.height).toBe(PLATFORM_HEIGHT);
    });

    it('includes a margin around a single child', () => {
      const node = makeCityNode({
        type: 'dir',
        children: [makeCityNode({ width: 1, height: 1 })],
      });

      const result = processNode(node);
      const child = result.children[0];

      expect(result.width).toBeGreaterThan(child.width);
      expect(result.depth).toBeGreaterThan(child.depth);
    });

    it('places multiple children with identical dimensions', () => {
      const node = makeCityNode({
        type: 'dir',
        children: Array.from({ length: 6 }, () => makeCityNode({ width: 2, height: 2 })),
      });

      const result = processNode(node);

      expect(result.positions).toHaveLength(6);
      assertNoOverlap(result);
    });
  });

  describe('nested directory nodes', () => {
    it('processes nested directories and files recursively', () => {
      const node = makeCityNode({
        type: 'dir',
        children: [
          makeCityNode({
            type: 'dir',
            children: [makeCityNode({ width: 3, height: 3 })],
          }),
          makeCityNode({ width: 2, height: 2 }),
        ],
      });

      const result = processNode(node);

      expect(result.children).toHaveLength(2);
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[1].children).toHaveLength(0);
      expect(result.positions).toHaveLength(2);
      assertNoOverlap(result);
    });
  });

  it('returns centered positions inside the calculated platform', () => {
    const node = makeCityNode({
      type: 'dir',
      children: [makeCityNode({ width: 2, height: 2 })],
    });

    const result = processNode(node);
    const position = result.positions[0];
    const child = result.children[0];

    expect(position.x).toBe(result.width / 2);
    expect(position.z).toBe(result.depth / 2);
    expect(position.x - child.width / 2).toBeGreaterThan(0);
    expect(position.z - child.depth / 2).toBeGreaterThan(0);
  });

  it('keeps a directory platform large enough for every child', () => {
    const node = makeCityNode({
      type: 'dir',
      children: [makeCityNode({ width: 20, height: 1 }), makeCityNode({ width: 1, height: 20 })],
    });

    const result = processNode(node);

    for (const [index, child] of result.children.entries()) {
      const position = result.positions[index];
      expect(position.x - child.width / 2).toBeGreaterThanOrEqual(0);
      expect(position.x + child.width / 2).toBeLessThanOrEqual(result.width);
      expect(position.z - child.depth / 2).toBeGreaterThanOrEqual(0);
      expect(position.z + child.depth / 2).toBeLessThanOrEqual(result.depth);
    }
  });

  it('handles a varied set of child sizes without overlap', () => {
    const sizes = [
      [1, 12],
      [8, 2],
      [3, 7],
      [10, 1],
      [2, 5],
      [6, 3],
      [4, 9],
      [12, 2],
      [5, 4],
      [2, 11],
      [9, 3],
      [3, 2],
      [7, 8],
      [1, 6],
      [11, 4],
    ];
    const node = makeCityNode({
      type: 'dir',
      children: sizes.map(([width, height]) => makeCityNode({ width, height })),
    });

    const result = processNode(node);

    expect(result.positions).toHaveLength(sizes.length);
    assertNoOverlap(result);
  });

  it('uses the fallback layout when child dimensions are not finite', () => {
    const node = makeCityNode({
      type: 'dir',
      children: [makeCityNode({ width: Number.NaN, height: 1 })],
    });

    const result = processNode(node);

    expect(Number.isNaN(result.width)).toBe(true);
    expect(result.positions).toHaveLength(1);
  });
});

describe('updateSkyline', () => {
  it('trims only the left side when the new segment ends at the existing segment end', () => {
    const skyline = [{ x: 0, z: 0, width: 10 }];

    updateSkyline(skyline, 5, 2, 5); // New segment [5,10) covers the right side of [0,10).

    expect(skyline.some((s) => s.x === 0 && s.width === 5 && s.z === 0)).toBe(true);
    expect(skyline.some((s) => s.x === 10)).toBe(false);
  });

  it('trims only the right side when the new segment starts at the existing segment start', () => {
    const skyline = [{ x: 0, z: 0, width: 10 }];

    updateSkyline(skyline, 0, 2, 5); // New segment [0,5) covers the left side of [0,10).

    expect(skyline.some((s) => s.x === 0 && s.z === 0)).toBe(false);
    expect(skyline.some((s) => s.x === 5 && s.width === 5 && s.z === 0)).toBe(true);
  });

  it('trims both sides when the new segment is placed in the middle', () => {
    const skyline = [{ x: 0, z: 0, width: 10 }];

    updateSkyline(skyline, 3, 2, 4); // New segment [3,7) sits inside [0,10).

    expect(skyline.some((s) => s.x === 0 && s.width === 3)).toBe(true);
    expect(skyline.some((s) => s.x === 7 && s.width === 3)).toBe(true);
  });

  it('leaves no remainder when the new segment exactly covers the old one', () => {
    const skyline = [{ x: 0, z: 0, width: 10 }];

    updateSkyline(skyline, 0, 2, 10);

    expect(skyline).toEqual([{ x: 0, z: 2, width: 10 }]);
  });

  it('preserves segments outside the updated range', () => {
    const skyline = [
      { x: 0, z: 0, width: 5 },
      { x: 5, z: 1, width: 5 },
      { x: 10, z: 0, width: 5 },
    ];

    updateSkyline(skyline, 6, 3, 2);

    expect(skyline).toEqual([
      { x: 0, z: 0, width: 5 },
      { x: 5, z: 1, width: 1 },
      { x: 6, z: 3, width: 2 },
      { x: 8, z: 1, width: 2 },
      { x: 10, z: 0, width: 5 },
    ]);
  });

  it('merges adjacent segments with matching heights', () => {
    const skyline = [
      { x: 0, z: 0, width: 5 },
      { x: 5, z: 0, width: 5 },
    ];

    updateSkyline(skyline, 2, 0, 3);

    expect(skyline).toEqual([{ x: 0, z: 0, width: 10 }]);
  });
});

describe('findBestPosition', () => {
  it('returns null when disjoint skyline segments cannot fit the requested width', () => {
    const skyline: SkylineSegment[] = [
      { x: 0, z: 1, width: 2 },
      { x: 5, z: 1, width: 2 },
    ];

    expect(findBestPosition(skyline, 4, 10)).toBeNull();
  });

  it('prefers the leftmost segment when candidate positions have equal heights', () => {
    const skyline: SkylineSegment[] = [
      { x: 5, z: 1, width: 5 },
      { x: 0, z: 1, width: 5 },
    ];

    expect(findBestPosition(skyline, 2, 10)).toEqual({ x: 0, z: 1 });
  });
});
