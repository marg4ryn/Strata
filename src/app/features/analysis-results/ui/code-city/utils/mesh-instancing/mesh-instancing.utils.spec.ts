import * as THREE from 'three';

import {
  clearCollectedGeometry,
  createAllInstancedMeshes,
  createGeometry,
  instanceMapKey,
} from './mesh-instancing.utils';
import type { CityNode, InstanceMap, ProcessedNode } from '../../code-city.model';

function makeCityNode(overrides: Partial<CityNode>): CityNode {
  return {
    name: 'test',
    path: '/test',
    type: 'file',
    ...overrides,
  };
}

function makeProcessedNode(overrides: Partial<ProcessedNode> = {}): ProcessedNode {
  return {
    width: 2,
    height: 4,
    depth: 6,
    children: [],
    positions: [],
    ...overrides,
  };
}

function getInstanceCenter(mesh: THREE.InstancedMesh, index = 0): THREE.Vector3 {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(index, matrix);
  return new THREE.Vector3().setFromMatrixPosition(matrix);
}

beforeEach(() => {
  clearCollectedGeometry();
});

afterEach(() => {
  clearCollectedGeometry();
});

describe('instanceMapKey', () => {
  it('combines the instance type and index', () => {
    expect(instanceMapKey('building', 3)).toBe('building_3');
    expect(instanceMapKey('platform', 0)).toBe('platform_0');
  });
});

describe('createGeometry and createAllInstancedMeshes', () => {
  it('creates a building mesh with the expected transform and instance data', () => {
    const node = makeCityNode({ width: 10, height: 20 });
    const instanceMap: InstanceMap = new Map();

    createGeometry(node, makeProcessedNode(), { x: 5, y: 2, z: 7 });
    const result = createAllInstancedMeshes(instanceMap);

    expect(result.group.children).toHaveLength(1);
    expect(result.meshes).toHaveLength(1);

    const mesh = result.meshes[0];
    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(1);
    expect(mesh.userData).toEqual({ type: 'building', isInstanced: true });
    expect(getInstanceCenter(mesh)).toEqual(new THREE.Vector3(5, 4, 7));
    expect(instanceMap.get('building_0')).toMatchObject({
      node,
      mesh,
      instanceIndex: 0,
      type: 'building',
    });
  });

  it('collects a directory platform and its children at translated positions', () => {
    const child = makeCityNode({ width: 3, height: 5 });
    const root = makeCityNode({ type: 'dir', children: [child] });
    const rootData = makeProcessedNode({
      width: 10,
      height: 2,
      depth: 8,
      children: [makeProcessedNode({ width: 3, height: 5, depth: 3 })],
      positions: [{ centerX: 3, centerZ: 4 }],
    });
    const instanceMap: InstanceMap = new Map();

    createGeometry(root, rootData, { x: 1, y: 2, z: 3 });
    const { meshes } = createAllInstancedMeshes(instanceMap);

    expect(meshes).toHaveLength(2);
    expect(meshes[0].userData['type']).toBe('building');
    expect(meshes[1].userData['type']).toBe('platform');
    expect(getInstanceCenter(meshes[1])).toEqual(new THREE.Vector3(1, 3, 3));
    expect(getInstanceCenter(meshes[0])).toEqual(new THREE.Vector3(-1, 6.5, 3));
    expect(instanceMap.get('building_0')?.node).toBe(child);
    expect(instanceMap.get('platform_0')?.node).toBe(root);
  });

  it('returns no meshes when no geometry was collected', () => {
    const instanceMap: InstanceMap = new Map();

    const result = createAllInstancedMeshes(instanceMap);

    expect(result.group.children).toEqual([]);
    expect(result.meshes).toEqual([]);
    expect(instanceMap).toHaveLength(0);
  });

  it('clears collected instances after creating meshes', () => {
    const node = makeCityNode({ width: 1, height: 1 });
    createGeometry(node, makeProcessedNode(), { x: 0, y: 0, z: 0 });

    createAllInstancedMeshes(new Map());
    const result = createAllInstancedMeshes(new Map());

    expect(result.meshes).toEqual([]);
  });

  it('clears collected instances explicitly', () => {
    const node = makeCityNode({ width: 1, height: 1 });
    createGeometry(node, makeProcessedNode(), { x: 0, y: 0, z: 0 });

    clearCollectedGeometry();

    expect(createAllInstancedMeshes(new Map()).meshes).toEqual([]);
  });
});
