import type * as THREE from 'three';

import { instanceMapKey } from '../mesh-instancing/mesh-instancing.utils';
import type {
  InstanceData,
  InstanceMap,
  InstancePathMap,
  InstanceType,
} from '../../code-city.model';

export function createInstancePathMap(instanceMap: InstanceMap): InstancePathMap {
  const instancePathMap: InstancePathMap = new Map();
  for (const data of instanceMap.values()) {
    if (!instancePathMap.has(data.node.path)) {
      instancePathMap.set(data.node.path, data);
    }
  }
  return instancePathMap;
}

export function findInstanceByPath(
  instancePathMap: InstancePathMap,
  path: string,
): InstanceData | undefined {
  return instancePathMap.get(path);
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
