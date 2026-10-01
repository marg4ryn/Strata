import * as THREE from 'three';

import type { ProcessedNode, InstanceData } from '../../code-city.model';

export const CAMERA_DAMPING = 0.1;
export const CENTER_TRANSITION_SPEED = 0.05;
export const AUTO_ROTATE_DELAY = 5000;
export const AUTO_ROTATE_SPEED = 0.0015;
export const BUILDING_ZOOM = 100;
export const PLATFORM_ZOOM_MULT = 4;
export const MIN_CAMERA_ROTATION_X = 0;
export const MAX_CAMERA_ROTATION_X = Math.PI / 2;

export interface CameraControls {
  isDragging: boolean;
  previousMousePosition: { x: number; y: number };
  rotation: { x: number; y: number };
  targetRotation: { x: number; y: number };
  rotationVelocity: { x: number; y: number };
  zoom: number;
  targetZoom: number;
  lastInteractionTime: number;
  currentCenter: THREE.Vector3;
  targetCenter: THREE.Vector3;
}

export function createCameraControls(initialZoom: number): CameraControls {
  return {
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0.5, y: 0.8 },
    targetRotation: { x: 0.5, y: 0.8 },
    rotationVelocity: { x: 0, y: 0 },
    zoom: initialZoom,
    targetZoom: initialZoom,
    lastInteractionTime: Date.now() - AUTO_ROTATE_DELAY,
    currentCenter: new THREE.Vector3(0, 0.5, 0),
    targetCenter: new THREE.Vector3(0, 0.5, 0),
  };
}

export function setRotationCenter(rotationCenter: THREE.Vector3, position: THREE.Vector3): void {
  rotationCenter.copy(position);
}

export function calculateInitialZoom(
  rootData: ProcessedNode,
  camera: THREE.PerspectiveCamera,
): number {
  const maxDimension = Math.max(rootData.width, rootData.depth);
  const fov = camera.fov * (Math.PI / 180);
  const distance = maxDimension / 2 / Math.tan(fov / 2);
  return Math.max(distance * PLATFORM_ZOOM_MULT, BUILDING_ZOOM);
}

export function calculateOptimalZoom(
  instanceData: InstanceData,
  camera: THREE.PerspectiveCamera,
): number {
  if (instanceData.type !== 'platform') return BUILDING_ZOOM;

  const geometry = instanceData.mesh.geometry as THREE.BoxGeometry;
  const maxDimension = Math.max(geometry.parameters.width, geometry.parameters.depth);
  const fov = camera.fov * (Math.PI / 180);
  const distance = maxDimension / 2 / Math.tan(fov / 2);
  return Math.max(distance * PLATFORM_ZOOM_MULT, BUILDING_ZOOM);
}

export function updateMousePosition(
  mouse: THREE.Vector2 | null,
  event: MouseEvent,
  rect: DOMRect,
): void {
  if (!mouse || rect.width === 0 || rect.height === 0) return;
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function beginCameraDrag(controls: CameraControls, event: MouseEvent): void {
  controls.isDragging = true;
  controls.previousMousePosition = { x: event.clientX, y: event.clientY };
  controls.lastInteractionTime = Date.now();
  controls.rotationVelocity = { x: 0, y: 0 };
}

export function rotateCameraFromPointer(controls: CameraControls, event: MouseEvent): void {
  const deltaX = event.clientX - controls.previousMousePosition.x;
  const deltaY = event.clientY - controls.previousMousePosition.y;
  controls.rotationVelocity.y = -deltaX * 0.005;
  controls.rotationVelocity.x = deltaY * 0.005;
  controls.targetRotation.y += controls.rotationVelocity.y;
  controls.targetRotation.x += controls.rotationVelocity.x;
  controls.targetRotation.x = Math.max(
    MIN_CAMERA_ROTATION_X,
    Math.min(MAX_CAMERA_ROTATION_X, controls.targetRotation.x),
  );
  controls.previousMousePosition = { x: event.clientX, y: event.clientY };
  controls.lastInteractionTime = Date.now();
}

export function zoomCameraFromWheel(
  controls: CameraControls,
  deltaY: number,
  initialZoom: number,
): void {
  controls.targetZoom += deltaY * 0.0007 * controls.targetZoom;
  controls.targetZoom = Math.max(40, Math.min(initialZoom * 1.5, controls.targetZoom));
}

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  controls: CameraControls,
  autoRotate: boolean,
): void {
  const timeSinceInteraction = Date.now() - controls.lastInteractionTime;
  if (timeSinceInteraction > AUTO_ROTATE_DELAY && autoRotate) {
    controls.targetRotation.y += AUTO_ROTATE_SPEED;
  }

  if (!controls.isDragging) {
    controls.rotationVelocity.x *= 0.95;
    controls.rotationVelocity.y *= 0.95;
    controls.targetRotation.x += controls.rotationVelocity.x;
    controls.targetRotation.y += controls.rotationVelocity.y;
  }

  controls.targetRotation.x = Math.max(
    MIN_CAMERA_ROTATION_X,
    Math.min(MAX_CAMERA_ROTATION_X, controls.targetRotation.x),
  );
  controls.rotation.x += (controls.targetRotation.x - controls.rotation.x) * CAMERA_DAMPING;
  controls.rotation.y += (controls.targetRotation.y - controls.rotation.y) * CAMERA_DAMPING;
  controls.zoom += (controls.targetZoom - controls.zoom) * CAMERA_DAMPING;
  controls.currentCenter.lerp(controls.targetCenter, CENTER_TRANSITION_SPEED);

  const { x, y, z } = controls.currentCenter;
  const distance = controls.zoom;
  camera.position.x = x + distance * Math.sin(controls.rotation.y) * Math.cos(controls.rotation.x);
  camera.position.y = y + distance * Math.sin(controls.rotation.x);
  camera.position.z = z + distance * Math.cos(controls.rotation.y) * Math.cos(controls.rotation.x);
  camera.lookAt(x, y, z);
}
