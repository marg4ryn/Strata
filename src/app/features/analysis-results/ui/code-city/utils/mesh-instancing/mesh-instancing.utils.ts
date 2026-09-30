import * as THREE from 'three';

import { addBoxEdgesToMerge, clearEdgeBuffer } from '../edge-generating/edge-generating.utils';
import { COLORS, UNIT_CUBE } from '../../code-city.model';
import type { CityNode, ProcessedNode, InstanceType, InstanceMap } from '../../code-city.model';

interface InstanceInfo {
  node: CityNode;
  matrix: THREE.Matrix4;
}

const BUILDING_TYPES: readonly InstanceType[] = ['building', 'platform'];

const instanceBuffer: Record<InstanceType, InstanceInfo[]> = {
  building: [],
  platform: [],
};

export const instanceMapKey = (type: InstanceType, index: number): string => `${type}_${index}`;

export function createGeometry(
  node: CityNode,
  nodeData: ProcessedNode,
  baseCenter: THREE.Vector3Like,
): void {
  if (node.height !== undefined && node.width !== undefined) {
    collectInstance('building', node, nodeData, baseCenter);
    return;
  }

  collectInstance('platform', node, nodeData, baseCenter);

  const originX = baseCenter.x - nodeData.width / 2;
  const originZ = baseCenter.z - nodeData.depth / 2;
  const childY = baseCenter.y + nodeData.height;

  node.children?.forEach((child, index) => {
    const { centerX, centerZ } = nodeData.positions[index];
    createGeometry(child, nodeData.children[index], {
      x: originX + centerX,
      y: childY,
      z: originZ + centerZ,
    });
  });
}

function collectInstance(
  type: InstanceType,
  node: CityNode,
  { width, height, depth }: ProcessedNode,
  baseCenter: THREE.Vector3Like,
): void {
  const matrix = createBoxMatrix(
    { x: baseCenter.x, y: baseCenter.y + height / 2, z: baseCenter.z },
    { x: width, y: height, z: depth },
  );

  instanceBuffer[type].push({ node, matrix });
  addBoxEdgesToMerge(matrix);
}

function createBoxMatrix(center: THREE.Vector3Like, size: THREE.Vector3Like): THREE.Matrix4 {
  return new THREE.Matrix4()
    .makeScale(size.x, size.y, size.z)
    .setPosition(center.x, center.y, center.z);
}

export function createAllInstancedMeshes(instanceMap: InstanceMap): {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
} {
  try {
    const meshes = BUILDING_TYPES.flatMap((type) => {
      const mesh = createInstancedMeshForType(type, instanceMap);
      return mesh ? [mesh] : [];
    });

    const group = new THREE.Group();
    if (meshes.length > 0) group.add(...meshes);

    return { group, meshes };
  } finally {
    clearInstanceBuffer();
  }
}

function createInstancedMeshForType(
  type: InstanceType,
  instanceMap: InstanceMap,
): THREE.InstancedMesh | null {
  const list = instanceBuffer[type];
  if (list.length === 0) return null;

  const color = new THREE.Color(COLORS[type]);
  const material = new THREE.MeshPhongMaterial({ color, emissive: COLORS.emissiveColor });

  const mesh = new THREE.InstancedMesh(UNIT_CUBE, material, list.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { type, isInstanced: true };

  list.forEach(({ node, matrix }, instanceIndex) => {
    mesh.setMatrixAt(instanceIndex, matrix);
    mesh.setColorAt(instanceIndex, color);
    instanceMap.set(instanceMapKey(type, instanceIndex), { node, mesh, instanceIndex, type });
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor!.needsUpdate = true;

  return mesh;
}

function clearInstanceBuffer(): void {
  instanceBuffer.building.length = 0;
  instanceBuffer.platform.length = 0;
}

export function clearCollectedGeometry(): void {
  clearEdgeBuffer();
  clearInstanceBuffer();
}
