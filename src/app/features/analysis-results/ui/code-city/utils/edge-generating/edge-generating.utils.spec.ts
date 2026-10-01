import * as THREE from 'three';

import {
  addBoxEdgesToMerge,
  createEdgesMesh,
  UNIT_CUBE_EDGES,
  VERTEX_STRIDE,
  EDGE_STRIDE,
} from './edge-generating.utils';
import type { EdgeInfo } from './edge-generating.utils';

let createdMeshes: THREE.InstancedMesh[];

function createAndTrackEdgesMesh(entries: readonly EdgeInfo[]): THREE.InstancedMesh {
  const mesh = createEdgesMesh(entries);
  createdMeshes.push(mesh);
  return mesh;
}

beforeEach(() => {
  createdMeshes = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  createdMeshes.forEach((mesh) => {
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material.dispose());
  });
});

describe('UNIT_CUBE_EDGES', () => {
  it('contains cube edges without the bottom perimeter', () => {
    expect(UNIT_CUBE_EDGES.length / EDGE_STRIDE).toBe(8);

    for (let index = 0; index < UNIT_CUBE_EDGES.length; index += EDGE_STRIDE) {
      const startY = UNIT_CUBE_EDGES[index + 1];
      const endY = UNIT_CUBE_EDGES[index + VERTEX_STRIDE + 1];

      expect(startY === -0.5 && endY === -0.5).toBe(false);
    }
  });
});

describe('addBoxEdgesToMerge', () => {
  it('applies the supplied matrix to each edge', () => {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(2, 3, 4),
      new THREE.Quaternion(),
      new THREE.Vector3(2, 3, 4),
    );
    const entries: EdgeInfo[] = [];
    addBoxEdgesToMerge(entries, matrix);

    const mesh = createAndTrackEdgesMesh(entries);
    const actualCenters: THREE.Vector3[] = [];
    const instanceMatrix = new THREE.Matrix4();

    for (let index = 0; index < mesh.count; index++) {
      mesh.getMatrixAt(index, instanceMatrix);
      actualCenters.push(new THREE.Vector3().setFromMatrixPosition(instanceMatrix));
    }

    const expectedCenters: THREE.Vector3[] = [];
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();

    for (let index = 0; index < UNIT_CUBE_EDGES.length; index += EDGE_STRIDE) {
      start.fromArray(UNIT_CUBE_EDGES, index).applyMatrix4(matrix);
      end.fromArray(UNIT_CUBE_EDGES, index + VERTEX_STRIDE).applyMatrix4(matrix);
      expectedCenters.push(start.clone().add(end).multiplyScalar(0.5));
    }

    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(mesh.count).toBe(8);
    actualCenters.forEach((center, index) => {
      expect(center.distanceTo(expectedCenters[index])).toBeLessThan(1e-6);
    });
  });
});

describe('createEdgesMesh', () => {
  it('creates meshes from only the supplied edge buffer', () => {
    const entries: EdgeInfo[] = [];
    addBoxEdgesToMerge(entries, new THREE.Matrix4());

    expect(createAndTrackEdgesMesh(entries).count).toBe(8);
    expect(createAndTrackEdgesMesh(entries).count).toBe(8);

    expect(createAndTrackEdgesMesh([]).count).toBe(0);
  });

  it('disposes allocated geometry and material when mesh population fails', () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.Material.prototype, 'dispose');
    vi.spyOn(THREE.InstancedMesh.prototype, 'setMatrixAt').mockImplementation(() => {
      throw new Error('Unable to populate edge mesh.');
    });

    expect(() =>
      createEdgesMesh([{ positions: UNIT_CUBE_EDGES, matrix: new THREE.Matrix4() }]),
    ).toThrow('Unable to populate edge mesh.');
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('disposes geometry and material when mesh construction fails before assignment', () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.MeshBasicMaterial.prototype, 'dispose');
    const malformedEntries: EdgeInfo[] = [
      { positions: null as unknown as Float32Array, matrix: new THREE.Matrix4() },
    ];

    expect(() => createEdgesMesh(malformedEntries)).toThrow();

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('disposes the assigned edge mesh when transforming an entry fails', () => {
    const geometryDispose = vi.spyOn(THREE.CylinderGeometry.prototype, 'dispose');
    const materialDispose = vi.spyOn(THREE.MeshBasicMaterial.prototype, 'dispose');
    const entries: EdgeInfo[] = [
      { positions: UNIT_CUBE_EDGES, matrix: null as unknown as THREE.Matrix4 },
    ];

    expect(() => createEdgesMesh(entries)).toThrow();

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });
});

describe('addBoxEdgesToMerge', () => {
  it('appends entries only to the supplied buffer', () => {
    const firstBuffer: EdgeInfo[] = [];
    const secondBuffer: EdgeInfo[] = [];
    addBoxEdgesToMerge(firstBuffer, new THREE.Matrix4());

    expect(createAndTrackEdgesMesh(firstBuffer).count).toBe(8);
    expect(createAndTrackEdgesMesh(secondBuffer).count).toBe(0);
  });
});
