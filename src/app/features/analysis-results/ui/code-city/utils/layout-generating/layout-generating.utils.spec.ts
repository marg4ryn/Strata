import {
  processNode,
  MIN_BUILDING_HEIGHT,
  MIN_BUILDING_WIDTH,
  BUILDING_HEIGHT_SCALE,
  BUILDING_WIDTH_SCALE,
  MIN_PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
} from './layout-generating.utils';
import type { CityNode, ProcessedNode } from '../../code-city.model';

const MARGIN = 1.5;
const EPS = 1e-6;

function makeCityNode(overrides: Partial<CityNode>): CityNode {
  return {
    name: 'test',
    type: 'file',
    path: '/test',
    ...overrides,
  } as CityNode;
}

const file = (width: number, height = 1) => makeCityNode({ width, height });
const dir = (...children: CityNode[]) => makeCityNode({ type: 'dir', children });

function rectsOf(node: ProcessedNode) {
  return node.children.map((child, i) => {
    const pos = node.positions[i];
    return {
      minX: pos.centerX - child.width / 2,
      maxX: pos.centerX + child.width / 2,
      minZ: pos.centerZ - child.depth / 2,
      maxZ: pos.centerZ + child.depth / 2,
    };
  });
}

function assertValidLayout(node: ProcessedNode, deep = true) {
  const rects = rectsOf(node);

  for (const r of rects) {
    expect(r.minX).toBeGreaterThanOrEqual(MARGIN - EPS);
    expect(r.minZ).toBeGreaterThanOrEqual(MARGIN - EPS);
    expect(r.maxX).toBeLessThanOrEqual(node.width - MARGIN + EPS);
    expect(r.maxZ).toBeLessThanOrEqual(node.depth - MARGIN + EPS);
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const closeX = a.minX < b.maxX + MARGIN - EPS && b.minX < a.maxX + MARGIN - EPS;
      const closeZ = a.minZ < b.maxZ + MARGIN - EPS && b.minZ < a.maxZ + MARGIN - EPS;
      expect(closeX && closeZ).toBe(false);
    }
  }

  if (deep) node.children.forEach((child) => assertValidLayout(child));
}

const treeWithElongatedFolder = () => dir(dir(file(2), file(2), file(2)), file(6), file(6));

describe('processNode', () => {
  describe('file node', () => {
    it('calculates dimensions from scaled source values', () => {
      const result = processNode(file(10, 20));

      expect(result.width).toBe((MIN_BUILDING_WIDTH + 10) * BUILDING_WIDTH_SCALE);
      expect(result.height).toBe((MIN_BUILDING_HEIGHT + 20) * BUILDING_HEIGHT_SCALE);
      expect(result.depth).toBe(result.width);
    });

    it('returns no children or positions', () => {
      const result = processNode(file(1, 1));

      expect(result.children).toEqual([]);
      expect(result.positions).toEqual([]);
    });

    it('uses minimum dimensions for zero width and height', () => {
      const result = processNode(file(0, 0));

      expect(result.width).toBe(MIN_BUILDING_WIDTH * BUILDING_WIDTH_SCALE);
      expect(result.height).toBe(MIN_BUILDING_HEIGHT * BUILDING_HEIGHT_SCALE);
    });
  });

  describe('empty directory node', () => {
    it('returns minimum platform dimensions', () => {
      const result = processNode(dir());

      expect(result.width).toBe(MIN_PLATFORM_WIDTH);
      expect(result.depth).toBe(MIN_PLATFORM_WIDTH);
      expect(result.height).toBe(PLATFORM_HEIGHT);
      expect(result.children).toEqual([]);
      expect(result.positions).toEqual([]);
    });

    it('treats a missing children field as an empty list', () => {
      const result = processNode(makeCityNode({ type: 'dir' }));

      expect(result.width).toBe(MIN_PLATFORM_WIDTH);
    });
  });

  describe('directory node with children', () => {
    it('keeps positions in the original child order after internal sorting', () => {
      const children = [file(1), file(10), file(5)];

      const result = processNode(dir(...children));

      expect(result.positions).toHaveLength(3);
      result.children.forEach((child, i) => {
        expect(child.width).toBe(processNode(children[i]).width);
      });
      assertValidLayout(result);
    });

    it('places children without overlap and with margins', () => {
      const result = processNode(dir(file(2), file(4), file(1), file(3)));

      assertValidLayout(result);
    });

    it('keeps platform height independent of child dimensions', () => {
      const result = processNode(dir(file(5, 100)));

      expect(result.height).toBe(PLATFORM_HEIGHT);
    });

    it('centers a single child with a margin on every side', () => {
      const result = processNode(dir(file(2, 2)));
      const child = result.children[0];
      const position = result.positions[0];

      expect(result.width).toBeCloseTo(child.width + 2 * MARGIN);
      expect(result.depth).toBeCloseTo(child.depth + 2 * MARGIN);
      expect(position.centerX).toBeCloseTo(result.width / 2);
      expect(position.centerZ).toBeCloseTo(result.depth / 2);
    });

    it('places multiple children with identical dimensions', () => {
      const result = processNode(dir(...Array.from({ length: 6 }, () => file(2, 2))));

      expect(result.positions).toHaveLength(6);
      assertValidLayout(result);
    });

    it('handles a varied set of child sizes', () => {
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

      const result = processNode(dir(...sizes.map(([width, height]) => file(width, height))));

      expect(result.positions).toHaveLength(sizes.length);
      assertValidLayout(result);
    });

    it('does not waste much space on many similar buildings', () => {
      const children = Array.from({ length: 30 }, (_, i) => file(1 + (i % 4) * 0.5));

      const result = processNode(dir(...children));
      const used = result.children.reduce(
        (sum, c) => sum + (c.width + MARGIN) * (c.depth + MARGIN),
        0,
      );

      expect(used / (result.width * result.depth)).toBeGreaterThan(0.7);
      expect(Math.max(result.width / result.depth, result.depth / result.width)).toBeLessThan(1.5);
    });

    it('falls back to a layout when child dimensions are not finite', () => {
      const result = processNode(dir(file(Number.NaN, 1)));

      expect(Number.isNaN(result.width)).toBe(true);
      expect(result.positions).toHaveLength(1);
    });
  });

  describe('nested directory nodes', () => {
    it('processes nested directories and files recursively', () => {
      const result = processNode(dir(dir(file(3, 3)), file(2, 2)));

      expect(result.children).toHaveLength(2);
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[1].children).toHaveLength(0);
      expect(result.positions).toHaveLength(2);
      assertValidLayout(result);
    });

    it('produces a valid layout on every level of a deep tree', () => {
      const tree = dir(
        dir(file(1), file(2), dir(file(3), file(1), dir(file(2), file(2)))),
        dir(file(4), file(1), file(1)),
        dir(),
        file(5),
        dir(dir(file(1), file(1), file(1), file(1)), file(2)),
      );

      assertValidLayout(processNode(tree));
    });

    it('is deterministic', () => {
      const tree = dir(dir(file(1), file(3)), file(2), dir(file(4), file(1)));

      expect(processNode(tree)).toEqual(processNode(tree));
    });
  });

  describe('folder rotation', () => {
    it('rotates an elongated folder when it makes the parent smaller', () => {
      const tree = treeWithElongatedFolder();

      const rotated = processNode(tree);
      const plain = processNode(tree, { rotateFolders: false });

      expect(rotated.children[0].width).toBeCloseTo(plain.children[0].depth);
      expect(rotated.children[0].depth).toBeCloseTo(plain.children[0].width);
      expect(rotated.width * rotated.depth).toBeLessThan(plain.width * plain.depth);
    });

    it('keeps the rotated folder contents valid', () => {
      assertValidLayout(processNode(treeWithElongatedFolder()));
    });

    it('leaves files unrotated', () => {
      const result = processNode(treeWithElongatedFolder());

      for (const child of result.children.slice(1)) {
        expect(child.width).toBe(child.depth);
      }
    });
  });
});
