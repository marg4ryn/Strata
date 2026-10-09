import * as THREE from 'three';

import { COLORS } from '../../code-city.model';
import type { InstanceData, InstanceMap, ColorData, PathColorData } from '../../code-city.model';

const COLOR_INTENSITY_MULTIPLIER = 2;
const BASE_COLOR = new THREE.Color(COLORS.building);

const tempColor = new THREE.Color();
const tempTarget = new THREE.Color();

let colorDataMap = new Map<string, ColorData>();

export function getColorDataForPath(path: string): ColorData | undefined {
  return colorDataMap.get(path);
}

export function applyColorData(colorData: PathColorData[], instanceMap: InstanceMap): void {
  colorDataMap = new Map(
    colorData.map(({ path, color, intensity }) => [path, { color, intensity }]),
  );

  updateBuildingColors(instanceMap, (data, out) => {
    const info = colorDataMap.get(data.node.path);
    if (!info) return false;

    computeColor(out, info);
    return true;
  });
}

export function clearColorData(instanceMap: InstanceMap): void {
  colorDataMap.clear();

  updateBuildingColors(instanceMap, (_data, out) => {
    computeColor(out);
    return true;
  });
}

export function applyInteractionColor(instanceData: InstanceData, color: number): void {
  writeInstanceColor(instanceData, tempColor.set(color));
}

export function restoreOriginalColor(instanceData: InstanceData): void {
  const info = colorDataMap.get(instanceData.node.path);
  writeInstanceColor(instanceData, computeColor(tempColor, info));
}

function writeInstanceColor(data: InstanceData, color: THREE.Color): void {
  data.mesh.setColorAt(data.instanceIndex, color);
  data.mesh.instanceColor!.needsUpdate = true;
}

function updateBuildingColors(
  instanceMap: InstanceMap,
  getColor: (data: InstanceData, out: THREE.Color) => boolean,
): void {
  const color = new THREE.Color();
  const updatedMeshes = new Set<THREE.InstancedMesh>();

  instanceMap.forEach((data) => {
    if (data.type !== 'building' || !getColor(data, color)) return;

    data.mesh.setColorAt(data.instanceIndex, color);
    updatedMeshes.add(data.mesh);
  });

  updatedMeshes.forEach((mesh) => {
    mesh.instanceColor!.needsUpdate = true;
  });
}

function computeColor(out: THREE.Color, info?: ColorData): THREE.Color {
  if (!info) return out.copy(BASE_COLOR);

  const t = Math.max(0, Math.min(1, info.intensity * COLOR_INTENSITY_MULTIPLIER));
  tempTarget.set(info.color);
  return out.lerpColors(BASE_COLOR, tempTarget, t);
}
