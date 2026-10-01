import * as THREE from 'three';

import { COLORS, UNIT_CUBE } from '../../code-city.model';
import type { CityNode, InstanceData, InstanceType } from '../../code-city.model';
import {
  disposeCodeCityMesh,
  disposeCodeCityMeshes,
} from '../resource-disposing/resource-disposing.utils';

export interface InstanceInfo {
  node: CityNode;
  matrix: THREE.Matrix4;
}

export type InstanceBuffer = Record<InstanceType, InstanceInfo[]>;

const BUILDING_TYPES: readonly InstanceType[] = ['building', 'platform'];

export const instanceMapKey = (type: InstanceType, index: number): string => `${type}_${index}`;

export function createAllInstancedMeshes(instanceBuffer: InstanceBuffer): {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  instanceEntries: [string, InstanceData][];
} {
  const meshes: THREE.InstancedMesh[] = [];
  const instanceEntries: [string, InstanceData][] = [];

  try {
    for (const type of BUILDING_TYPES) {
      const mesh = createInstancedMeshForType(type, instanceBuffer, instanceEntries);
      if (mesh) meshes.push(mesh);
    }

    const group = new THREE.Group();
    if (meshes.length > 0) group.add(...meshes);

    return { group, meshes, instanceEntries };
  } catch (error) {
    disposeCodeCityMeshes(meshes);
    throw error;
  }
}

function createInstancedMeshForType(
  type: InstanceType,
  instanceBuffer: InstanceBuffer,
  instanceEntries: [string, InstanceData][],
): THREE.InstancedMesh | null {
  const list = instanceBuffer[type];
  if (list.length === 0) return null;

  const color = new THREE.Color(COLORS[type]);
  const material = new THREE.MeshPhongMaterial({ color, emissive: COLORS.emissiveColor });

  let mesh: THREE.InstancedMesh | null = null;
  try {
    mesh = new THREE.InstancedMesh(UNIT_CUBE, material, list.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type, isInstanced: true };

    list.forEach(({ node, matrix }, instanceIndex) => {
      mesh!.setMatrixAt(instanceIndex, matrix);
      mesh!.setColorAt(instanceIndex, color);
      instanceEntries.push([
        instanceMapKey(type, instanceIndex),
        { node, mesh: mesh!, instanceIndex, type },
      ]);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    return mesh;
  } catch (error) {
    if (mesh) {
      disposeCodeCityMesh(mesh);
    } else {
      material.dispose();
    }
    throw error;
  }
}
