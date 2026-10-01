import * as THREE from 'three';

import { disposeCodeCityMesh } from '../resource-disposing/resource-disposing.utils';
import { COLORS, UNIT_CUBE } from '../../code-city.model';

export interface EdgeInfo {
  positions: Float32Array;
  matrix: THREE.Matrix4;
}

export const VERTEX_STRIDE = 3; // x, y, z
export const EDGE_STRIDE = VERTEX_STRIDE * 2; // 2 vertices per edge

const Y_TO_Z_ROTATION = Math.PI / 2; // places the cylinder along the Z axis
const EDGE_RADIAL_SEGMENTS = 4; // square cross-section for minimum cost
const EDGE_HEIGHT_SEGMENTS = 1;
const EDGE_UNIT_LENGTH = 1;
const EDGE_RADIUS = 0.1;
const EPSILON = 0.001;
const Y_OFFSET = 1;

const Z_AXIS = new THREE.Vector3(0, 0, 1);

export const UNIT_CUBE_EDGES = extractNonBottomEdges(UNIT_CUBE);

function extractNonBottomEdges(geometry: THREE.BufferGeometry): Float32Array {
  const edges = new THREE.EdgesGeometry(geometry);
  try {
    const positions = edges.attributes['position'].array as Float32Array;

    let minY = Infinity;
    for (let i = Y_OFFSET; i < positions.length; i += VERTEX_STRIDE) {
      minY = Math.min(minY, positions[i]);
    }

    const isOnBase = (y: number): boolean => Math.abs(y - minY) <= EPSILON;
    const filtered: number[] = [];

    for (let i = 0; i < positions.length; i += EDGE_STRIDE) {
      const startY = positions[i + Y_OFFSET];
      const endY = positions[i + VERTEX_STRIDE + Y_OFFSET];

      if (!(isOnBase(startY) && isOnBase(endY))) {
        for (let j = 0; j < EDGE_STRIDE; j++) filtered.push(positions[i + j]);
      }
    }

    return new Float32Array(filtered);
  } finally {
    edges.dispose();
  }
}

export function addBoxEdgesToMerge(buffer: EdgeInfo[], matrix: THREE.Matrix4): void {
  buffer.push({ positions: UNIT_CUBE_EDGES, matrix });
}

export function createEdgesMesh(entries: readonly EdgeInfo[]): THREE.InstancedMesh {
  const geometry = new THREE.CylinderGeometry(
    EDGE_RADIUS,
    EDGE_RADIUS,
    EDGE_UNIT_LENGTH,
    EDGE_RADIAL_SEGMENTS,
    EDGE_HEIGHT_SEGMENTS,
  );
  let material: THREE.MeshBasicMaterial | null = null;
  let mesh: THREE.InstancedMesh | null = null;
  try {
    geometry.rotateX(Y_TO_Z_ROTATION);
    material = new THREE.MeshBasicMaterial({ color: COLORS.edge });
    mesh = new THREE.InstancedMesh(geometry, material, countEdges(entries));

    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    const edgeMatrix = new THREE.Matrix4();
    const segmentDirection = new THREE.Vector3();
    const segmentMidpoint = new THREE.Vector3();
    const segmentScale = new THREE.Vector3();
    const segmentRotation = new THREE.Quaternion();

    let index = 0;
    for (const { positions, matrix } of entries) {
      for (let i = 0; i < positions.length; i += EDGE_STRIDE) {
        start.fromArray(positions, i).applyMatrix4(matrix);
        end.fromArray(positions, i + VERTEX_STRIDE).applyMatrix4(matrix);

        composeSegmentMatrix(
          edgeMatrix,
          start,
          end,
          segmentDirection,
          segmentMidpoint,
          segmentScale,
          segmentRotation,
        );
        mesh.setMatrixAt(index++, edgeMatrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  } catch (error) {
    if (mesh) {
      disposeCodeCityMesh(mesh);
    } else {
      geometry.dispose();
      material?.dispose();
    }
    throw error;
  }
}

function countEdges(entries: readonly EdgeInfo[]): number {
  return entries.reduce((sum, { positions }) => sum + positions.length / EDGE_STRIDE, 0);
}

function composeSegmentMatrix(
  target: THREE.Matrix4,
  start: THREE.Vector3,
  end: THREE.Vector3,
  direction: THREE.Vector3,
  midpoint: THREE.Vector3,
  scale: THREE.Vector3,
  rotation: THREE.Quaternion,
): void {
  direction.subVectors(end, start);
  const length = direction.length();
  rotation.setFromUnitVectors(Z_AXIS, direction.normalize());
  midpoint.addVectors(start, end).divideScalar(2);
  target.compose(midpoint, rotation, scale.set(1, 1, length));
}
