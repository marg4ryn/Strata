import * as THREE from 'three';

import { GeometryBuilder } from '../../builders/geometry.builder';
import { processNode } from '../layout-generating/layout-generating.utils';
import { disposeMesh } from '../resource-disposing/resource-disposing.utils';
import type { ProcessedNode, InstanceMap, CityNode } from '../../code-city.model';

export interface SceneResources {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
}

const RAYCASTER_LINE_THRESHOLD = 0.1;
const RAYCASTER_POINTS_THRESHOLD = 0.1;

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10000;
const MIN_CONTAINER_HEIGHT = 1;

const LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 1.2;
const DIRECTIONAL_LIGHT_INTENSITY = 1.5;
const DIRECTIONAL_LIGHT_POSITION = new THREE.Vector3(1000, 1000, 500);

const getAspect = (container: HTMLDivElement): number =>
  container.clientWidth / Math.max(container.clientHeight, MIN_CONTAINER_HEIGHT);

export function populateScene(
  data: CityNode,
  scene: THREE.Scene,
  instanceMap: InstanceMap,
): { rootData: ProcessedNode; meshes: THREE.InstancedMesh[] } {
  const rootData = processNode(data);
  const built = new GeometryBuilder().build(data, rootData, instanceMap);
  const { group, meshes, edges } = built;
  scene.add(group, edges);
  return { rootData, meshes };
}

export function createScene(
  container: HTMLDivElement | null,
  initialZoom: number,
): SceneResources | null {
  if (!container) return null;

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: RAYCASTER_LINE_THRESHOLD };
  raycaster.params.Points = { threshold: RAYCASTER_POINTS_THRESHOLD };
  const mouse = new THREE.Vector2();
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    getAspect(container),
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.set(initialZoom, initialZoom, initialZoom);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY));

  const directionalLight = new THREE.DirectionalLight(LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
  directionalLight.position.copy(DIRECTIONAL_LIGHT_POSITION);
  scene.add(directionalLight);

  return { scene, camera, renderer, raycaster, mouse };
}

export function disposeScene(
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
    disposeMesh(object);
  });
}

export function resizeScene(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
): void {
  camera.aspect = getAspect(container);
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
