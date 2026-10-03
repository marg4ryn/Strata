import * as THREE from 'three';

import type { InstanceData } from '../../code-city.model';
import { calculateOptimalZoom } from './camera-controlling.utils';

function createInstanceData(
  type: InstanceData['type'],
  width: number,
  depth: number,
): InstanceData {
  return {
    node: { name: 'test', path: '/test', type: 'dir' },
    width,
    depth,
    type,
    instanceIndex: 0,
    mesh: new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), 1),
  };
}

describe('calculateOptimalZoom', () => {
  it('calculates platform zoom from ProcessedNode dimensions', () => {
    const instanceData = createInstanceData('platform', 400, 300);
    const camera = new THREE.PerspectiveCamera(60);

    const zoom = calculateOptimalZoom(instanceData, camera);
    const expected = (400 / 2 / Math.tan((60 * Math.PI) / 360)) * 0.5;

    expect(zoom).toBeCloseTo(expected);
  });

  it('keeps building zoom fixed', () => {
    const instanceData = createInstanceData('building', 400, 300);

    expect(calculateOptimalZoom(instanceData, new THREE.PerspectiveCamera(60))).toBe(100);
  });
});
