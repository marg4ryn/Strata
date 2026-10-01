import * as THREE from 'three';

import { createAllInstancedMeshes, instanceMapKey } from './mesh-instancing.utils';
import type { InstanceBuffer, InstanceInfo } from './mesh-instancing.utils';
import { UNIT_CUBE } from '../../code-city.model';
import type { CityNode } from '../../code-city.model';

function makeCityNode(overrides: Partial<CityNode>): CityNode {
  return {
    name: 'test',
    path: '/test',
    type: 'file',
    ...overrides,
  };
}

function getInstanceCenter(mesh: THREE.InstancedMesh, index = 0): THREE.Vector3 {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(index, matrix);
  return new THREE.Vector3().setFromMatrixPosition(matrix);
}

describe('instanceMapKey', () => {
  it('combines the instance type and index', () => {
    expect(instanceMapKey('building', 3)).toBe('building_3');
    expect(instanceMapKey('platform', 0)).toBe('platform_0');
  });
});

describe('createAllInstancedMeshes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a building mesh with the expected transform and instance data', () => {
    const node = makeCityNode({ width: 10, height: 20 });
    const instanceBuffer: InstanceBuffer = {
      building: [
        {
          node,
          matrix: new THREE.Matrix4().makeScale(2, 4, 6).setPosition(5, 4, 7),
        },
      ],
      platform: [],
    };

    const result = createAllInstancedMeshes(instanceBuffer);

    expect(result.group.children).toHaveLength(1);
    expect(result.meshes).toHaveLength(1);

    const mesh = result.meshes[0];
    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(1);
    expect(mesh.userData).toEqual({ type: 'building', isInstanced: true });
    expect(getInstanceCenter(mesh)).toEqual(new THREE.Vector3(5, 4, 7));
    expect(result.instanceEntries).toEqual([
      ['building_0', { node, mesh, instanceIndex: 0, type: 'building' }],
    ]);
  });

  it('returns no meshes when no geometry was collected', () => {
    const instanceBuffer: InstanceBuffer = { building: [], platform: [] };

    const result = createAllInstancedMeshes(instanceBuffer);

    expect(result.group.children).toEqual([]);
    expect(result.meshes).toEqual([]);
    expect(result.instanceEntries).toEqual([]);
  });

  it('uses only the explicitly supplied instance buffer', () => {
    const node = makeCityNode({ width: 1, height: 1 });
    const populatedBuffer: InstanceBuffer = {
      building: [{ node, matrix: new THREE.Matrix4() }],
      platform: [],
    };
    const emptyBuffer: InstanceBuffer = { building: [], platform: [] };

    expect(createAllInstancedMeshes(populatedBuffer).meshes[0].count).toBe(1);
    expect(createAllInstancedMeshes(emptyBuffer).meshes).toEqual([]);
    expect(populatedBuffer.building).toHaveLength(1);
  });

  it('disposes an allocated mesh but preserves its shared geometry when population fails', () => {
    const node = makeCityNode({ width: 1, height: 1 });
    const instanceBuffer: InstanceBuffer = {
      building: [{ node, matrix: new THREE.Matrix4() }],
      platform: [],
    };
    const geometryDispose = vi.spyOn(UNIT_CUBE, 'dispose');
    const materialDispose = vi.spyOn(THREE.MeshPhongMaterial.prototype, 'dispose');
    vi.spyOn(THREE.InstancedMesh.prototype, 'setColorAt').mockImplementation(() => {
      throw new Error('Unable to populate instance mesh.');
    });

    expect(() => createAllInstancedMeshes(instanceBuffer)).toThrow(
      'Unable to populate instance mesh.',
    );
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('disposes the material when mesh construction fails before assignment', () => {
    const node = makeCityNode({ width: 1, height: 1 });
    let lengthReads = 0;
    const buildingBuffer = new Proxy([{ node, matrix: new THREE.Matrix4() }], {
      get(target, property, receiver) {
        if (property === 'length') {
          lengthReads++;
          return lengthReads === 1 ? 1 : -1;
        }
        return Reflect.get(target, property, receiver);
      },
    }) as unknown as InstanceInfo[];
    const instanceBuffer: InstanceBuffer = { building: buildingBuffer, platform: [] };
    const materialDispose = vi.spyOn(THREE.MeshPhongMaterial.prototype, 'dispose');

    expect(() => createAllInstancedMeshes(instanceBuffer)).toThrow();

    expect(materialDispose).toHaveBeenCalledOnce();
  });
});
