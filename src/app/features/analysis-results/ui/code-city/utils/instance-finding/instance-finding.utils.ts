import type * as THREE from 'three';

import { instanceMapKey } from '../mesh-instancing/mesh-instancing.utils';
import type { InstanceData, InstanceMap, InstanceType } from '../../code-city.model';

export function findInstanceByPath(
  instanceMap: InstanceMap,
  path: string,
): InstanceData | undefined {
  for (const data of instanceMap.values()) {
    if (data.node.path === path) return data;
  }
  return undefined;
}

export function findInstanceAtPointer(
  camera: THREE.Camera,
  raycaster: THREE.Raycaster,
  mouse: THREE.Vector2,
  objects: THREE.Object3D[],
  instanceMap: InstanceMap,
  recursive: boolean,
): InstanceData | null {
  camera.updateMatrixWorld();
  raycaster.setFromCamera(mouse, camera);

  for (const intersect of raycaster.intersectObjects(objects, recursive)) {
    if (!intersect.object.userData['isInstanced'] || intersect.instanceId === undefined) continue;

    const type = intersect.object.userData['type'] as InstanceType;
    const instanceData = instanceMap.get(instanceMapKey(type, intersect.instanceId));
    if (instanceData) return instanceData;
  }

  return null;
}
