import * as THREE from 'three';

import {
  addBoxEdgesToMerge,
  clearPendingEdges,
  createMergedEdges,
  UNIT_CUBE_EDGES,
  VERTEX_STRIDE,
  EDGE_STRIDE,
} from './edge-geometry.utils';

let createdMeshes: THREE.InstancedMesh[];

function createAndTrackMergedEdges(): THREE.InstancedMesh {
  const mesh = createMergedEdges();
  createdMeshes.push(mesh);
  return mesh;
}

beforeEach(() => {
  createdMeshes = [];
  clearPendingEdges();
});

afterEach(() => {
  clearPendingEdges();
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
    addBoxEdgesToMerge(matrix);

    const mesh = createAndTrackMergedEdges();
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

describe('createMergedEdges', () => {
  it('clears queued edges after creating the merged mesh', () => {
    addBoxEdgesToMerge(new THREE.Matrix4());

    expect(createAndTrackMergedEdges().count).toBe(8);
    expect(createAndTrackMergedEdges().count).toBe(0);

    addBoxEdgesToMerge(new THREE.Matrix4());
    expect(createAndTrackMergedEdges().count).toBe(8);
  });
});

describe('clearPendingEdges', () => {
  it('removes queued edges', () => {
    addBoxEdgesToMerge(new THREE.Matrix4());
    clearPendingEdges();

    expect(createAndTrackMergedEdges().count).toBe(0);
  });
});
