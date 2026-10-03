import * as THREE from 'three';

import { GeometryBuilder } from './geometry.builder';
import type { CityNode, InstanceData, InstanceMap, ProcessedNode } from '../code-city.model';
import { UNIT_CUBE } from '../code-city.model';

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

describe('GeometryBuilder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds meshes and edges for a directory and its child', () => {
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

    const result = new GeometryBuilder().build(root, rootData, instanceMap);

    expect(result.meshes).toHaveLength(2);
    expect(result.meshes[0].userData['type']).toBe('building');
    expect(result.meshes[1].userData['type']).toBe('platform');
    expect(getInstanceCenter(result.meshes[1])).toEqual(new THREE.Vector3(0, 1, 0));
    expect(getInstanceCenter(result.meshes[0])).toEqual(new THREE.Vector3(-2, 4.5, 0));
    expect(result.edges.count).toBe(16);
    expect(instanceMap.get('building_0')?.node).toBe(child);
    expect(instanceMap.get('building_0')).toMatchObject({ width: 3, depth: 3 });
    expect(instanceMap.get('platform_0')?.node).toBe(root);
    expect(instanceMap.get('platform_0')).toMatchObject({ width: 10, depth: 8 });
  });

  it('keeps buffers isolated across repeated builds', () => {
    const builder = new GeometryBuilder();
    const file = makeCityNode({ width: 1, height: 1 });
    const nodeData = makeProcessedNode();

    const first = builder.build(file, nodeData, new Map());
    const second = builder.build(file, nodeData, new Map());

    expect(first.meshes[0].count).toBe(1);
    expect(second.meshes[0].count).toBe(1);
    expect(first.edges.count).toBe(8);
    expect(second.edges.count).toBe(8);
  });

  it('propagates collection errors before allocating meshes or edges', () => {
    const child = makeCityNode({ width: 1, height: 1 });
    const root = makeCityNode({ type: 'dir', children: [child] });
    const instanceMap: InstanceMap = new Map();
    const edgesGeometryDispose = vi.spyOn(THREE.CylinderGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.Material.prototype, 'dispose');

    expect(() => new GeometryBuilder().build(root, makeProcessedNode(), instanceMap)).toThrow();

    expect(instanceMap.size).toBe(0);
    expect(edgesGeometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
  });

  it('rolls back map entries and disposes completed edges and meshes if committing fails', () => {
    class FailingInstanceMap extends Map<string, InstanceData> {
      override set(key: string, value: InstanceData): this {
        if (key === 'platform_0') throw new Error('Map commit failed.');
        return super.set(key, value);
      }
    }

    const child = makeCityNode({ width: 1, height: 1 });
    const root = makeCityNode({ type: 'dir', children: [child] });
    const rootData = makeProcessedNode({
      children: [makeProcessedNode()],
      positions: [{ centerX: 1, centerZ: 1 }],
    });
    const instanceMap: InstanceMap = new FailingInstanceMap();
    const previousEntry: InstanceData = {
      node: makeCityNode({ width: 2, height: 2 }),
      width: 2,
      depth: 2,
      type: 'building',
      instanceIndex: 0,
      mesh: new THREE.InstancedMesh(UNIT_CUBE, new THREE.MeshBasicMaterial(), 1),
    };
    instanceMap.set('building_0', previousEntry);
    const edgesGeometryDispose = vi.spyOn(THREE.CylinderGeometry.prototype, 'dispose');
    const edgesMaterialDispose = vi.spyOn(THREE.MeshBasicMaterial.prototype, 'dispose');
    const meshMaterialDispose = vi.spyOn(THREE.MeshPhongMaterial.prototype, 'dispose');

    expect(() => new GeometryBuilder().build(root, rootData, instanceMap)).toThrow(
      'Map commit failed.',
    );

    expect(instanceMap.size).toBe(1);
    expect(instanceMap.get('building_0')).toBe(previousEntry);
    expect(edgesGeometryDispose).toHaveBeenCalledOnce();
    expect(edgesMaterialDispose).toHaveBeenCalledOnce();
    expect(meshMaterialDispose).toHaveBeenCalledTimes(2);
    (previousEntry.mesh.material as THREE.Material).dispose();
  });
});
