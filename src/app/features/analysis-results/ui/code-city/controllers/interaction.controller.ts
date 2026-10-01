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

const HOVER_CHECK_INTERVAL = 2;
const CLICK_DISTANCE_THRESHOLD = 15;
const CLICK_TIME_THRESHOLD = 200;

export interface CodeCityInteractionOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  meshes: THREE.InstancedMesh[];
  instanceMap: InstanceMap;
  controls: CameraControls;
  initialZoom: () => number;
  selectedObject: () => InstanceData | null;
  hoveredObject: () => InstanceData | null;
  onSelect: (instanceData: InstanceData | null) => void;
  onHover: (instanceData: InstanceData | null) => void;
}

export class CodeCityInteractionController {
  private isMouseOverCanvas = false;
  private hoverCheckFrameCounter = 0;
  private mouseDownPosition = { x: 0, y: 0 };
  private mouseDownTime = 0;
  private isHoverCheckScheduled = false;
  private hoverAnimationId: number | null = null;

  private readonly handleMouseDown = (event: MouseEvent): void => {
    const { controls } = this.options;
    beginCameraDrag(controls, event);
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.mouseDownTime = Date.now();

    const hoveredObject = this.options.hoveredObject();
    if (hoveredObject && hoveredObject !== this.options.selectedObject()) {
      this.options.onHover(null);
    }
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    updateMousePosition(this.options.mouse, event, this.options.canvas.getBoundingClientRect());
    if (this.options.controls.isDragging) {
      rotateCameraFromPointer(this.options.controls, event);
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
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
    this.options.controls.isDragging = false;
    this.options.onHover(null);
  };

  constructor(private readonly options: CodeCityInteractionOptions) {
    const { canvas } = options;
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('wheel', this.handleWheel);
    canvas.addEventListener('mouseenter', this.handleMouseEnter);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  checkHover(): void {
    if (!this.isMouseOverCanvas) return;
    this.hoverCheckFrameCounter++;
    if (this.hoverCheckFrameCounter < HOVER_CHECK_INTERVAL) return;

    this.hoverCheckFrameCounter = 0;
    this.handleHover();
  }

  destroy(): void {
    const { canvas } = this.options;
    canvas.removeEventListener('mousedown', this.handleMouseDown);
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('wheel', this.handleWheel);
    canvas.removeEventListener('mouseenter', this.handleMouseEnter);
    canvas.removeEventListener('mouseleave', this.handleMouseLeave);

    if (this.hoverAnimationId !== null) {
      cancelAnimationFrame(this.hoverAnimationId);
      this.hoverAnimationId = null;
    }
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
    } else if (clickedInstanceData !== this.options.selectedObject()) {
      this.options.onSelect(clickedInstanceData);
    }
  }

  private handleHover(): void {
    if (this.options.controls.isDragging) {
      this.options.onHover(null);
      return;
    }
    if (this.isHoverCheckScheduled) return;

    this.isHoverCheckScheduled = true;
    this.hoverAnimationId = requestAnimationFrame(() => {
      this.hoverAnimationId = null;
      const newHoveredData = findInstanceAtPointer(
        this.options.camera,
        this.options.raycaster,
        this.options.mouse,
        this.options.meshes,
        this.options.instanceMap,
        false,
      );

      if (newHoveredData !== this.options.hoveredObject()) {
        this.options.onHover(newHoveredData);
      }
      this.isHoverCheckScheduled = false;
    });
  }
}
