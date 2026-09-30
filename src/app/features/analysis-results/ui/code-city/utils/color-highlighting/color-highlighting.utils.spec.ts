import * as THREE from 'three';

import {
  applyColorData,
  applyInteractionColor,
  clearColorData,
  getColorDataForPath,
  restoreOriginalColor,
} from './color-highlighting.utils';
import { COLORS } from '../../code-city.model';
import type { InstanceData } from '../../code-city.model';

function createBuildingData(path: string, instanceIndex = 0): InstanceData {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ vertexColors: true }),
    2,
  );

  return {
    node: {
      name: path.split('/').pop() ?? path,
      path,
      type: 'file',
    },
    type: 'building',
    instanceIndex,
    mesh,
  };
}

function getMeshColor(instanceData: InstanceData): THREE.Color {
  const color = new THREE.Color();
  instanceData.mesh.getColorAt(instanceData.instanceIndex, color);
  return color;
}

it('stores color metadata for a path and applies the expected gradient', () => {
  const path = '/src/app/example.service.ts';
  const instanceMap = new Map<string, InstanceData>([[path, createBuildingData(path)]]);
  const colorData = [{ path, color: 0xff0000, intensity: 0.25 }];

  applyColorData(colorData, instanceMap);

  expect(getColorDataForPath(path)).toEqual({ color: 0xff0000, intensity: 0.25 });

  const result = getMeshColor(instanceMap.get(path)!);
  const expected = new THREE.Color().lerpColors(
    new THREE.Color(COLORS.building),
    new THREE.Color(colorData[0].color),
    0.75,
  );

  expect(result.r).toBeCloseTo(expected.r);
  expect(result.g).toBeCloseTo(expected.g);
  expect(result.b).toBeCloseTo(expected.b);
});

it('clears all stored path colors and restores the base building color', () => {
  const path = '/src/app/feature.ts';
  const instanceMap = new Map<string, InstanceData>([[path, createBuildingData(path)]]);

  applyColorData([{ path, color: 0x00ff00, intensity: 0.5 }], instanceMap);
  clearColorData(instanceMap);

  expect(getColorDataForPath(path)).toBeUndefined();

  const baseColor = getMeshColor(instanceMap.get(path)!);
  expect(baseColor.r).toBe(1);
  expect(baseColor.g).toBe(1);
  expect(baseColor.b).toBe(1);
});

it('applies a temporary interaction color and then restores the original path color', () => {
  const path = '/src/app/selected-file.ts';
  const instanceMap = new Map<string, InstanceData>([[path, createBuildingData(path)]]);

  applyColorData([{ path, color: 0x00ff00, intensity: 0.5 }], instanceMap);
  applyInteractionColor(instanceMap.get(path)!, 0xff00ff);

  const interactionColor = getMeshColor(instanceMap.get(path)!);
  expect(interactionColor.r).toBeCloseTo(1);
  expect(interactionColor.g).toBeCloseTo(0);
  expect(interactionColor.b).toBeCloseTo(1);

  restoreOriginalColor(instanceMap.get(path)!);

  const restoredColor = getMeshColor(instanceMap.get(path)!);
  expect(restoredColor.r).toBeCloseTo(0);
  expect(restoredColor.g).toBeCloseTo(1);
  expect(restoredColor.b).toBeCloseTo(0);
});

it('skips building updates when a path has no matching color data', () => {
  const path = '/src/app/missing-color.ts';
  const otherPath = '/src/app/other.ts';
  const instanceMap = new Map<string, InstanceData>([
    [path, createBuildingData(path)],
    [otherPath, createBuildingData(otherPath, 1)],
  ]);

  applyColorData([{ path: otherPath, color: 0x0000ff, intensity: 0.5 }], instanceMap);

  expect(getColorDataForPath(path)).toBeUndefined();

  const missingColor = getMeshColor(instanceMap.get(path)!);
  expect(missingColor.r).toBe(1);
  expect(missingColor.g).toBe(1);
  expect(missingColor.b).toBe(1);
});
