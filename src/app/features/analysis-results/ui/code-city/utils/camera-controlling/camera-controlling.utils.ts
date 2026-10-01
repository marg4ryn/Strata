import * as THREE from 'three';

import type { ProcessedNode, InstanceData } from '../../code-city.model';

export interface CameraControls {
  isDragging: boolean;
  previousMousePosition: { x: number; y: number };
  rotation: { x: number; y: number };
  targetRotation: { x: number; y: number };
  rotationVelocity: { x: number; y: number };
  zoom: number;
  targetZoom: number;
  lastPointerTime: number;
  lastInteractionTime: number;
  currentCenter: THREE.Vector3;
  targetCenter: THREE.Vector3;
}

export const AUTO_ROTATE_DELAY = 5000; // ms

const CAMERA_DAMPING = 0.1; // Fraction of remaining distance per frame
const CENTER_TRANSITION_SPEED = 0.05; // Same, for orbit center shift
const AUTO_ROTATE_SPEED = 0.05; // rad/s
const BUILDING_ZOOM = 100; // World units
const PLATFORM_ZOOM_MULT = 4; // Scales fit-to-frame distance
const MIN_CAMERA_ROTATION_X = 0; // Pitch, rad (horizon)
const MAX_CAMERA_ROTATION_X = Math.PI / 2; // Pitch, rad (top-down)
const REFERENCE_FPS = 60; // Frame rate that per-frame constants are tuned for
const MAX_DELTA_TIME = 0.1; // s, guards against jumps after tab inactivity
const MIN_POINTER_DELTA_TIME = 0.001; // s, avoids division by ~0
const ROTATE_SENSITIVITY = 0.003; // rad/px
const VELOCITY_DECAY_PER_SECOND = 0.001; // Fraction of velocity left after 1 s
const MIN_ROTATION_VELOCITY = 0.1; // rad/s, below this inertia stops

export function createCameraControls(initialZoom: number): CameraControls {
  return {
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0.5, y: 0.8 },
    targetRotation: { x: 0.5, y: 0.8 },
    rotationVelocity: { x: 0, y: 0 },
    zoom: initialZoom,
    targetZoom: initialZoom,
    lastPointerTime: 0,
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
  controls.lastPointerTime = event.timeStamp;
  controls.rotationVelocity = { x: 0, y: 0 };
}

export function rotateCameraFromPointer(controls: CameraControls, event: MouseEvent): void {
  const deltaX = event.clientX - controls.previousMousePosition.x;
  const deltaY = event.clientY - controls.previousMousePosition.y;
  const dt = Math.max((event.timeStamp - controls.lastPointerTime) / 1000, MIN_POINTER_DELTA_TIME);

  const rotationDeltaY = -deltaX * ROTATE_SENSITIVITY;
  const rotationDeltaX = deltaY * ROTATE_SENSITIVITY;

  controls.rotationVelocity.y = rotationDeltaY / dt;
  controls.rotationVelocity.x = rotationDeltaX / dt;

  controls.targetRotation.y += rotationDeltaY;
  controls.targetRotation.x = Math.max(
    MIN_CAMERA_ROTATION_X,
    Math.min(MAX_CAMERA_ROTATION_X, controls.targetRotation.x + rotationDeltaX),
  );

  controls.previousMousePosition = { x: event.clientX, y: event.clientY };
  controls.lastPointerTime = event.timeStamp;
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
  deltaTime: number,
): void {
  const dt = Math.min(deltaTime, MAX_DELTA_TIME);

  const timeSinceInteraction = Date.now() - controls.lastInteractionTime;
  if (timeSinceInteraction > AUTO_ROTATE_DELAY && autoRotate) {
    controls.targetRotation.y += AUTO_ROTATE_SPEED * dt;
  }

  if (!controls.isDragging) {
    const decay = Math.pow(VELOCITY_DECAY_PER_SECOND, dt);
    controls.rotationVelocity.x *= decay;
    controls.rotationVelocity.y *= decay;

    if (Math.abs(controls.rotationVelocity.x) < MIN_ROTATION_VELOCITY) {
      controls.rotationVelocity.x = 0;
    }
    if (Math.abs(controls.rotationVelocity.y) < MIN_ROTATION_VELOCITY) {
      controls.rotationVelocity.y = 0;
    }

    controls.targetRotation.x += controls.rotationVelocity.x * dt;
    controls.targetRotation.y += controls.rotationVelocity.y * dt;
  }

  controls.targetRotation.x = Math.max(
    MIN_CAMERA_ROTATION_X,
    Math.min(MAX_CAMERA_ROTATION_X, controls.targetRotation.x),
  );

  const damping = frameIndependentFactor(CAMERA_DAMPING, dt);
  controls.rotation.x += (controls.targetRotation.x - controls.rotation.x) * damping;
  controls.rotation.y += (controls.targetRotation.y - controls.rotation.y) * damping;
  controls.zoom += (controls.targetZoom - controls.zoom) * damping;
  controls.currentCenter.lerp(
    controls.targetCenter,
    frameIndependentFactor(CENTER_TRANSITION_SPEED, dt),
  );

  const { x, y, z } = controls.currentCenter;
  const distance = controls.zoom;
  camera.position.set(
    x + distance * Math.sin(controls.rotation.y) * Math.cos(controls.rotation.x),
    y + distance * Math.sin(controls.rotation.x),
    z + distance * Math.cos(controls.rotation.y) * Math.cos(controls.rotation.x),
  );
  camera.lookAt(x, y, z);
}

function frameIndependentFactor(perFrameFactor: number, dt: number): number {
  return 1 - Math.pow(1 - perFrameFactor, dt * REFERENCE_FPS);
}
