import * as THREE from 'three';

import { GeometryBuilder } from '../geometry-building/geometry-builder';
import { processNode } from '../layout-generating/layout-generating.utils';
import { disposeCodeCityMesh } from '../resource-disposing/resource-disposing.utils';
import type { ProcessedNode, InstanceMap, CityNode } from '../../code-city.model';

export interface ThreeSceneResources {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
}

export function populateThreeScene(
  data: CityNode,
  scene: THREE.Scene,
  instanceMap: InstanceMap,
): { rootData: ProcessedNode; meshes: THREE.InstancedMesh[] } {
  const rootData = processNode(data);
  const { group, meshes, edges } = new GeometryBuilder().build(data, rootData, instanceMap);
  scene.add(group, edges);
  return { rootData, meshes };
}

export function createThreeScene(
  container: HTMLDivElement | null,
  initialZoom: number,
): ThreeSceneResources | null {
  if (!container) return null;

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.1 };
  raycaster.params.Points = { threshold: 0.1 };
  const mouse = new THREE.Vector2();
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    10000,
  );
  camera.position.set(initialZoom, initialZoom, initialZoom);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xd9d9d9, 0.5));

  const directionalLight = new THREE.DirectionalLight(0xd9d9d9, 0.5);
  directionalLight.position.set(1000, 1000, 500);
  scene.add(directionalLight);

  return { scene, camera, renderer, raycaster, mouse };
}

export function disposeThreeScene(
  container: HTMLDivElement,
  scene: THREE.Scene | null,
  renderer: THREE.WebGLRenderer | null,
): void {
  if (renderer) {
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }

  scene?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    disposeCodeCityMesh(object);
  });
}

export function resizeThreeScene(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
): void {
  camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
