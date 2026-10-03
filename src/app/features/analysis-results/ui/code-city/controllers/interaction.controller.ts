import type * as THREE from 'three';

import {
  beginCameraDrag,
  rotateCameraFromPointer,
  updateMousePosition,
  zoomCameraFromWheel,
} from '../utils/camera-controlling/camera-controlling.utils';
import type { CameraControls } from '../utils/camera-controlling/camera-controlling.utils';
import { findInstanceAtPointer } from '../utils/instance-finding/instance-finding.utils';
import type { InstanceData, InstanceMap } from '../code-city.model';

const HOVER_CHECK_INTERVAL_MS = 33;
const CLICK_DISTANCE_THRESHOLD = 15;
const CLICK_TIME_THRESHOLD = 200;

export interface InteractionOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  meshes: THREE.InstancedMesh[];
  instanceMap: InstanceMap;
  controls: CameraControls;
  initialZoom: () => number;
  selectedInstance: () => InstanceData | null;
  hoveredInstance: () => InstanceData | null;
  isHoverSuspended: () => boolean;
  onPointerActivity: () => void;
  onSelect: (instanceData: InstanceData | null) => void;
  onHover: (instanceData: InstanceData | null) => void;
}

export class InteractionController {
  private isMouseOverCanvas = false;
  private lastHoverCheckTime = 0;
  private mouseDownPosition = { x: 0, y: 0 };
  private mouseDownTime = 0;

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;

    this.options.onPointerActivity();
    const { controls } = this.options;
    beginCameraDrag(controls, event);
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.mouseDownTime = Date.now();

    const hoveredInstance = this.options.hoveredInstance();
    if (hoveredInstance && hoveredInstance !== this.options.selectedInstance()) {
      this.options.onHover(null);
    }
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.options.onPointerActivity();
    updateMousePosition(this.options.mouse, event, this.options.canvas.getBoundingClientRect());
    if (this.options.controls.isDragging) {
      rotateCameraFromPointer(this.options.controls, event);
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button !== 0) return;

    this.options.controls.isDragging = false;
    this.handleClick(event);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    zoomCameraFromWheel(this.options.controls, event.deltaY, this.options.initialZoom());
  };

  private readonly handleMouseEnter = (): void => {
    this.isMouseOverCanvas = true;
  };

  private readonly handleMouseLeave = (): void => {
    this.isMouseOverCanvas = false;
    this.options.mouse.set(Infinity, Infinity);
    this.options.controls.isDragging = false;
    if (!this.options.isHoverSuspended()) this.options.onHover(null);
  };

  constructor(private readonly options: InteractionOptions) {
    const { canvas } = options;
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('wheel', this.handleWheel);
    canvas.addEventListener('mouseenter', this.handleMouseEnter);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  checkHover(now: number = performance.now()): void {
    if (this.options.isHoverSuspended()) return;
    if (!this.isMouseOverCanvas) return;
    if (now - this.lastHoverCheckTime < HOVER_CHECK_INTERVAL_MS) return;
    this.lastHoverCheckTime = now;

    if (this.options.controls.isDragging) {
      this.options.onHover(null);
      return;
    }

    const hovered = findInstanceAtPointer(
      this.options.camera,
      this.options.raycaster,
      this.options.mouse,
      this.options.meshes,
      this.options.instanceMap,
      false,
    );
    if (hovered !== this.options.hoveredInstance()) this.options.onHover(hovered);
  }

  restorePointerPosition(clientX: number, clientY: number): void {
    const rect = this.options.canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      this.isMouseOverCanvas = false;
      return;
    }

    this.isMouseOverCanvas = true;
    updateMousePosition(
      this.options.mouse,
      new MouseEvent('mousemove', { clientX, clientY }),
      rect,
    );
    const now = performance.now();
    this.lastHoverCheckTime = now - HOVER_CHECK_INTERVAL_MS;
    this.checkHover(now);
  }

  destroy(): void {
    const { canvas } = this.options;
    canvas.removeEventListener('mousedown', this.handleMouseDown);
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('wheel', this.handleWheel);
    canvas.removeEventListener('mouseenter', this.handleMouseEnter);
    canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleClick(event: MouseEvent): void {
    const timeDiff = Date.now() - this.mouseDownTime;
    const distance = Math.hypot(
      event.clientX - this.mouseDownPosition.x,
      event.clientY - this.mouseDownPosition.y,
    );
    if (distance >= CLICK_DISTANCE_THRESHOLD || timeDiff >= CLICK_TIME_THRESHOLD) return;

    const clickedInstanceData = findInstanceAtPointer(
      this.options.camera,
      this.options.raycaster,
      this.options.mouse,
      this.options.scene.children,
      this.options.instanceMap,
      true,
    );

    if (!clickedInstanceData) {
      this.options.onSelect(null);
    } else {
      this.options.onSelect(clickedInstanceData);
    }
  }
}
