import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import type { AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';

import type { CityNode } from '../../analysis-results.model';
import { CodeCityStateService } from '../../feature/code-city-shell/services/code-city-state.service';
import {
  applyColorData,
  clearColorData,
  clearEdgesCache,
  createAllInstancedMeshes,
  createGeometry,
  createMergedEdges,
  getColorDataForPath,
  COLORS,
} from '../../utils/code-city-geometry/code-city-geometry.utils';
import { processNode } from '../../utils/code-city-layout/code-city-layout.utils';
import type { ProcessedNode } from '../../utils/code-city-layout/code-city-layout.utils';

interface InstanceData {
  node: CityNode;
  mesh: THREE.InstancedMesh;
  instanceIndex: number;
  type: 'building' | 'platform';
}

export interface ColorData {
  path: string;
  color: number;
  intensity: number;
}

const CAMERA_DAMPING = 0.05;
const CENTER_TRANSITION_SPEED = 0.05;
const AUTO_ROTATE_DELAY = 5000;
const AUTO_ROTATE_SPEED = 0.0015;
const BUILDING_ZOOM = 100;
const PLATFORM_ZOOM_MULT = 4;
const MIN_CAMERA_ROTATION_X = 0;
const MAX_CAMERA_ROTATION_X = Math.PI / 2; // 90 degrees
const HOVER_CHECK_INTERVAL = 2; // in frames

@Component({
  selector: 'app-code-city',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-city.component.scss',
  templateUrl: './code-city.component.html',
})
export class CodeCityComponent implements AfterViewInit, OnDestroy {
  private readonly state = inject(CodeCityStateService);

  data = input<CityNode | null>(null);
  colorData = input<ColorData[]>([]);
  autoRotate = input<boolean>(false);
  initialZoom = input<number>(150);

  selectedNode = model<string | null>(null);
  hoveredNode = model<string | null>(null);

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private animationId: number | null = null;
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private isHoverCheckScheduled = false;
  private hoverCheckFrameCounter = 0;
  private mouseDownPosition = { x: 0, y: 0 };
  private mouseDownTime = 0;
  private resizeHandler: (() => void) | null = null;
  private isMouseOverCanvas = false;
  private threeScene: THREE.Scene | null = null;
  private threeCamera: THREE.PerspectiveCamera | null = null;
  private threeRenderer: THREE.WebGLRenderer | null = null;
  private threeRaycaster: THREE.Raycaster | null = null;
  private threeMouse: THREE.Vector2 | null = null;
  private hoveredObject: InstanceData | null = null;
  private selectedObject: InstanceData | null = null;
  private readonly objectMap = new Map<string, InstanceData>();
  private readonly rotationCenter = new THREE.Vector3(0, 0, 0);

  private readonly controls = {
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0.5, y: 0.8 },
    targetRotation: { x: 0.5, y: 0.8 },
    rotationVelocity: { x: 0, y: 0 },
    zoom: this.initialZoom(),
    targetZoom: this.initialZoom(),
    lastInteractionTime: Date.now() - AUTO_ROTATE_DELAY,
    currentCenter: new THREE.Vector3(0, 0.5, 0),
    targetCenter: new THREE.Vector3(0, 0.5, 0),
  };

  private readonly keydownHandler = (event: KeyboardEvent): void => this.handleKeyPress(event);

  constructor() {
    effect(() => {
      this.selectCityNodeByPath(this.state.selectedNode());
    });

    effect(() => {
      this.setCityNodeHoverByPath(this.state.hoveredNode());
    });

    effect(() => {
      const colorData = this.colorData();
      clearColorData(this.objectMap);
      if (colorData.length > 0) {
        applyColorData(colorData, this.objectMap);
      }
    });

    effect(() => {
      if (this.autoRotate()) {
        this.controls.lastInteractionTime = Date.now() - AUTO_ROTATE_DELAY;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    window.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy(): void {
    this.cleanup();
    window.removeEventListener('keydown', this.keydownHandler);
  }

  private initScene(): boolean {
    const container = this.containerRef().nativeElement;
    if (!container) return false;

    this.threeRaycaster = new THREE.Raycaster();
    this.threeRaycaster.params.Line = { threshold: 0.1 };
    this.threeRaycaster.params.Points = { threshold: 0.1 };
    this.threeMouse = new THREE.Vector2();
    this.threeScene = new THREE.Scene();

    this.threeCamera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      10000,
    );
    this.threeCamera.position.set(this.initialZoom(), this.initialZoom(), this.initialZoom());

    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.threeRenderer.setSize(container.clientWidth, container.clientHeight);
    this.threeRenderer.shadowMap.enabled = true;
    container.appendChild(this.threeRenderer.domElement);

    this.threeScene.add(new THREE.AmbientLight(0xd9d9d9, 0.5));

    const directionalLight = new THREE.DirectionalLight(0xd9d9d9, 0.5);
    directionalLight.position.set(1000, 1000, 500);
    this.threeScene.add(directionalLight);

    return true;
  }

  private setRotationCenter(position: THREE.Vector3): void {
    this.rotationCenter.copy(position);
  }

  private cleanupScene(): void {
    const container = this.containerRef().nativeElement;

    if (this.threeRenderer) {
      if (container.contains(this.threeRenderer.domElement)) {
        container.removeChild(this.threeRenderer.domElement);
      }
      this.threeRenderer.dispose();
      this.threeRenderer = null;
    }

    this.threeScene?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    });
    this.threeScene = null;

    clearEdgesCache();

    this.threeCamera = null;
    this.threeRaycaster = null;
    this.threeMouse = null;
    this.instancedMeshes = [];
  }

  private cleanup(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.cleanupScene();
    this.clearSelection();
  }

  private clearSelection(): void {
    this.hoveredObject = null;
    this.selectedObject = null;
    this.rotationCenter.set(0, 0, 0);
    this.objectMap.clear();
  }

  private selectCityNode(instanceData: InstanceData, notify: boolean): void {
    if (this.selectedObject && this.selectedObject !== instanceData) {
      this.restoreOriginalColor(this.selectedObject);
    }

    this.selectedObject = instanceData;
    const mesh = instanceData.mesh;
    const selectedColor = new THREE.Color();
    selectedColor.lerpColors(new THREE.Color(COLORS.building), new THREE.Color(COLORS.selected), 3);
    mesh.setColorAt(instanceData.instanceIndex, selectedColor);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceData.instanceIndex, matrix);
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    this.controls.targetCenter.copy(position);
    this.setRotationCenter(position);

    if (this.threeCamera) {
      this.controls.targetZoom = this.calculateOptimalZoom(instanceData, this.threeCamera);
    }
    this.controls.lastInteractionTime = Date.now();

    if (notify) {
      this.selectedNode.set(instanceData.node.path);
      this.state.selectedNode.set(instanceData.node.path);
    }
  }

  private deselectCityNode(notify: boolean): void {
    if (this.selectedObject) {
      this.restoreOriginalColor(this.selectedObject);
      this.selectedObject = null;
    }

    this.controls.targetCenter.set(0, 0.5, 0);
    this.setRotationCenter(this.controls.targetCenter);
    this.controls.targetZoom = this.initialZoom();

    if (notify) {
      this.selectedNode.set(null);
      this.state.selectedNode.set(null);
    }
  }

  private selectCityNodeByPath(path: string | null): boolean {
    if (!path) {
      this.deselectCityNode(false);
      return true;
    }

    const targetData = Array.from(this.objectMap.values()).find((data) => data.node.path === path);
    if (!targetData) return false;

    this.selectCityNode(targetData, false);
    return true;
  }

  private setCityNodeHover(instanceData: InstanceData | null, notify: boolean): void {
    this.hoveredObject = instanceData;

    if (instanceData && instanceData !== this.selectedObject) {
      const hoverColor = new THREE.Color();
      hoverColor.lerpColors(new THREE.Color(COLORS.building), new THREE.Color(COLORS.hover), 3);
      instanceData.mesh.setColorAt(instanceData.instanceIndex, hoverColor);
      if (instanceData.mesh.instanceColor) instanceData.mesh.instanceColor.needsUpdate = true;

      if (notify) {
        this.hoveredNode.set(instanceData.node.path);
        this.state.hoveredNode.set(instanceData.node.path);
      }
    }
  }

  private resetCityNodeHover(notify: boolean): void {
    const previousHoveredObject = this.hoveredObject;
    if (previousHoveredObject && previousHoveredObject !== this.selectedObject) {
      this.restoreOriginalColor(previousHoveredObject);
    }
    this.hoveredObject = null;

    if (notify) {
      this.hoveredNode.set(null);
      this.state.hoveredNode.set(null);
    }
  }

  private setCityNodeHoverByPath(path: string | null): boolean {
    if (!path) {
      this.resetCityNodeHover(false);
      return true;
    }

    const targetData = Array.from(this.objectMap.values()).find((data) => data.node.path === path);
    if (!targetData) return false;

    this.resetCityNodeHover(false);
    this.setCityNodeHover(targetData, false);
    return true;
  }

  private handleClick(event: MouseEvent): void {
    const camera = this.threeCamera;
    const scene = this.threeScene;
    const raycaster = this.threeRaycaster;
    const mouse = this.threeMouse;
    if (!camera || !scene || !raycaster || !mouse) return;

    const timeDiff = Date.now() - this.mouseDownTime;
    const distance = Math.hypot(
      event.clientX - this.mouseDownPosition.x,
      event.clientY - this.mouseDownPosition.y,
    );
    if (distance >= 15 || timeDiff >= 200) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let clickedInstanceData: InstanceData | undefined;

    for (const intersect of intersects) {
      if (!intersect.object.userData['isInstanced'] || intersect.instanceId === undefined) continue;

      const mesh = intersect.object as THREE.InstancedMesh;
      const instanceKey = `${mesh.userData['instanceKey']}_${intersect.instanceId}`;
      clickedInstanceData = this.objectMap.get(instanceKey);
      if (clickedInstanceData) break;
    }

    if (!clickedInstanceData) {
      this.deselectCityNode(true);
    } else if (clickedInstanceData !== this.selectedObject) {
      this.selectCityNode(clickedInstanceData, true);
    }
  }

  private handleHover(): void {
    if (this.controls.isDragging) {
      this.resetCityNodeHover(true);
      return;
    }
    if (this.isHoverCheckScheduled) return;

    this.isHoverCheckScheduled = true;
    requestAnimationFrame(() => {
      const camera = this.threeCamera;
      const raycaster = this.threeRaycaster;
      const mouse = this.threeMouse;
      if (!camera || !raycaster || !mouse) {
        this.isHoverCheckScheduled = false;
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(this.instancedMeshes, false);
      let newHoveredData: InstanceData | null = null;

      for (const intersect of intersects) {
        if (!intersect.object.userData['isInstanced'] || intersect.instanceId === undefined)
          continue;
        const mesh = intersect.object as THREE.InstancedMesh;
        const instanceKey = `${mesh.userData['instanceKey']}_${intersect.instanceId}`;
        newHoveredData = this.objectMap.get(instanceKey) ?? null;
        if (newHoveredData) break;
      }

      if (newHoveredData !== this.hoveredObject) {
        this.resetCityNodeHover(true);
        this.setCityNodeHover(newHoveredData, true);
      }
      this.isHoverCheckScheduled = false;
    });
  }

  private restoreOriginalColor(instanceData: InstanceData): void {
    const colorInfo = getColorDataForPath(instanceData.node.path);
    const originalColor = new THREE.Color(COLORS.building);

    if (colorInfo) {
      const resultColor = new THREE.Color();
      resultColor.lerpColors(
        originalColor,
        new THREE.Color(colorInfo.color),
        colorInfo.intensity * 3,
      );
      instanceData.mesh.setColorAt(instanceData.instanceIndex, resultColor);
    } else {
      instanceData.mesh.setColorAt(instanceData.instanceIndex, originalColor);
    }

    if (instanceData.mesh.instanceColor) instanceData.mesh.instanceColor.needsUpdate = true;
  }

  private calculateInitialZoom(rootData: ProcessedNode, camera: THREE.PerspectiveCamera): number {
    const maxDimension = Math.max(rootData.width, rootData.depth);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDimension / 2 / Math.tan(fov / 2);
    return Math.max(distance * PLATFORM_ZOOM_MULT, BUILDING_ZOOM);
  }

  private calculateOptimalZoom(
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

  private updateMousePosition(event: MouseEvent, rect: DOMRect): void {
    if (!this.threeMouse || rect.width === 0 || rect.height === 0) return;
    this.threeMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.threeMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private setupEventListeners(renderer: THREE.WebGLRenderer): void {
    const canvas = renderer.domElement;

    canvas.addEventListener('mousedown', (event) => {
      this.controls.isDragging = true;
      this.controls.previousMousePosition = { x: event.clientX, y: event.clientY };
      this.mouseDownPosition = { x: event.clientX, y: event.clientY };
      this.mouseDownTime = Date.now();
      this.controls.lastInteractionTime = Date.now();
      this.controls.rotationVelocity = { x: 0, y: 0 };

      if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
        this.resetCityNodeHover(true);
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      this.updateMousePosition(event, canvas.getBoundingClientRect());
      if (!this.controls.isDragging) return;

      const deltaX = event.clientX - this.controls.previousMousePosition.x;
      const deltaY = event.clientY - this.controls.previousMousePosition.y;
      this.controls.rotationVelocity.y = -deltaX * 0.005;
      this.controls.rotationVelocity.x = deltaY * 0.005;
      this.controls.targetRotation.y += this.controls.rotationVelocity.y;
      this.controls.targetRotation.x += this.controls.rotationVelocity.x;
      this.controls.targetRotation.x = Math.max(
        MIN_CAMERA_ROTATION_X,
        Math.min(MAX_CAMERA_ROTATION_X, this.controls.targetRotation.x),
      );
      this.controls.previousMousePosition = { x: event.clientX, y: event.clientY };
      this.controls.lastInteractionTime = Date.now();
    });

    canvas.addEventListener('mouseup', (event) => {
      this.controls.isDragging = false;
      this.handleClick(event);
    });

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.controls.targetZoom += event.deltaY * 0.0007 * this.controls.targetZoom;
      this.controls.targetZoom = Math.max(
        40,
        Math.min(this.initialZoom() * 1.5, this.controls.targetZoom),
      );
    });

    canvas.addEventListener('mouseenter', () => {
      this.isMouseOverCanvas = true;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isMouseOverCanvas = false;
      this.controls.isDragging = false;
      this.resetCityNodeHover(true);
    });
  }

  private updateCamera(camera: THREE.PerspectiveCamera): void {
    const timeSinceInteraction = Date.now() - this.controls.lastInteractionTime;
    if (timeSinceInteraction > AUTO_ROTATE_DELAY && this.autoRotate()) {
      this.controls.targetRotation.y += AUTO_ROTATE_SPEED;
    }

    if (!this.controls.isDragging) {
      this.controls.rotationVelocity.x *= 0.95;
      this.controls.rotationVelocity.y *= 0.95;
      this.controls.targetRotation.x += this.controls.rotationVelocity.x;
      this.controls.targetRotation.y += this.controls.rotationVelocity.y;
    }

    this.controls.targetRotation.x = Math.max(
      MIN_CAMERA_ROTATION_X,
      Math.min(MAX_CAMERA_ROTATION_X, this.controls.targetRotation.x),
    );
    this.controls.rotation.x +=
      (this.controls.targetRotation.x - this.controls.rotation.x) * CAMERA_DAMPING;
    this.controls.rotation.y +=
      (this.controls.targetRotation.y - this.controls.rotation.y) * CAMERA_DAMPING;
    this.controls.zoom += (this.controls.targetZoom - this.controls.zoom) * CAMERA_DAMPING;
    this.controls.currentCenter.lerp(this.controls.targetCenter, CENTER_TRANSITION_SPEED);

    const { x, y, z } = this.controls.currentCenter;
    const distance = this.controls.zoom;
    camera.position.x =
      x + distance * Math.sin(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
    camera.position.y = y + distance * Math.sin(this.controls.rotation.x);
    camera.position.z =
      z + distance * Math.cos(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
    camera.lookAt(x, y, z);
  }

  private initThreeJS(): void {
    const data = this.data();
    if (!data || !this.initScene()) return;

    const scene = this.threeScene;
    const camera = this.threeCamera;
    const renderer = this.threeRenderer;
    if (!scene || !camera || !renderer) return;

    if (this.threeMouse) {
      this.threeMouse.set(Infinity, Infinity);
    }

    const rootData = processNode(data);
    createGeometry(data, rootData, 0, 0, 0, this.objectMap);
    const { group, meshes } = createAllInstancedMeshes(this.objectMap);
    this.instancedMeshes = meshes;
    scene.add(group);
    scene.add(createMergedEdges());

    const optimalZoom = this.calculateInitialZoom(rootData, camera);
    this.controls.zoom = optimalZoom;
    this.controls.targetZoom = optimalZoom;
    applyColorData(this.colorData(), this.objectMap);
    this.setupEventListeners(renderer);

    this.selectCityNodeByPath(this.state.selectedNode());
    this.setCityNodeHoverByPath(this.state.hoveredNode());

    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate);
      this.updateCamera(camera);
      if (this.isMouseOverCanvas) {
        this.hoverCheckFrameCounter++;
        if (this.hoverCheckFrameCounter >= HOVER_CHECK_INTERVAL) {
          this.handleHover();
          this.hoverCheckFrameCounter = 0;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    this.resizeHandler = () => {
      const container = this.containerRef().nativeElement;
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.deselectCityNode(true);
    }
  }
}
