import * as THREE from 'three';

import { COLORS, UNIT_CUBE } from '../../code-city.model';

interface EdgeInfo {
  positions: Float32Array;
  matrix: THREE.Matrix4;
}

export const VERTEX_STRIDE = 3; // x, y, z
export const EDGE_STRIDE = VERTEX_STRIDE * 2; // 2 vertices per edge
const Y_OFFSET = 1;
const EPSILON = 0.001;

const EDGE_RADIUS = 0.1;
const EDGE_UNIT_LENGTH = 1;
const EDGE_RADIAL_SEGMENTS = 4; // square cross-section for minimum cost
const EDGE_HEIGHT_SEGMENTS = 1;
const Y_TO_Z_ROTATION = Math.PI / 2; // places the cylinder along the Z axis

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const SEGMENT_DIRECTION = new THREE.Vector3();
const SEGMENT_MIDPOINT = new THREE.Vector3();
const SEGMENT_SCALE = new THREE.Vector3();
const SEGMENT_ROTATION = new THREE.Quaternion();

export const UNIT_CUBE_EDGES = extractNonBottomEdges(UNIT_CUBE);

const edgeBuffer: EdgeInfo[] = [];

function extractNonBottomEdges(geometry: THREE.BufferGeometry): Float32Array {
  const edges = new THREE.EdgesGeometry(geometry);
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

  edges.dispose();
  return new Float32Array(filtered);
}

export function addBoxEdgesToMerge(matrix: THREE.Matrix4): void {
  edgeBuffer.push({ positions: UNIT_CUBE_EDGES, matrix });
}

export function createMergedEdges(): THREE.InstancedMesh {
  try {
    return createEdgesMesh(edgeBuffer);
  } finally {
    clearEdgeBuffer();
  }
}

export function clearEdgeBuffer(): void {
  edgeBuffer.length = 0;
}

function createEdgesMesh(entries: readonly EdgeInfo[]): THREE.InstancedMesh {
  const geometry = new THREE.CylinderGeometry(
    EDGE_RADIUS,
    EDGE_RADIUS,
    EDGE_UNIT_LENGTH,
    EDGE_RADIAL_SEGMENTS,
    EDGE_HEIGHT_SEGMENTS,
  );
  geometry.rotateX(Y_TO_Z_ROTATION);

  const material = new THREE.MeshBasicMaterial({ color: COLORS.edge });
  const mesh = new THREE.InstancedMesh(geometry, material, countEdges(entries));

  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const edgeMatrix = new THREE.Matrix4();

  let index = 0;
  for (const { positions, matrix } of entries) {
    for (let i = 0; i < positions.length; i += EDGE_STRIDE) {
      start.fromArray(positions, i).applyMatrix4(matrix);
      end.fromArray(positions, i + VERTEX_STRIDE).applyMatrix4(matrix);

      composeSegmentMatrix(edgeMatrix, start, end);
      mesh.setMatrixAt(index++, edgeMatrix);
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function countEdges(entries: readonly EdgeInfo[]): number {
  return entries.reduce((sum, { positions }) => sum + positions.length / EDGE_STRIDE, 0);
}

function composeSegmentMatrix(
  target: THREE.Matrix4,
  start: THREE.Vector3,
  end: THREE.Vector3,
): void {
  SEGMENT_DIRECTION.subVectors(end, start);
  const length = SEGMENT_DIRECTION.length();
  SEGMENT_ROTATION.setFromUnitVectors(Z_AXIS, SEGMENT_DIRECTION.normalize());
  SEGMENT_MIDPOINT.addVectors(start, end).divideScalar(2);
  target.compose(SEGMENT_MIDPOINT, SEGMENT_ROTATION, SEGMENT_SCALE.set(1, 1, length));
}
