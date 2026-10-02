import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
  NgZone,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { AfterViewInit, OnDestroy } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import * as THREE from 'three';

import { injectLogger } from '@app/core/logging';
import { InteractionController } from '../controllers/interaction.controller';
import { CodeCityRenderer } from '../renderers/code-city.renderer';
import {
  AUTO_ROTATE_DELAY,
  calculateInitialZoom,
  calculateOptimalZoom,
  createCameraControls,
  setRotationCenter,
} from '../utils/camera-controlling/camera-controlling.utils';
import type { CameraControls } from '../utils/camera-controlling/camera-controlling.utils';
import {
  applyColorData,
  clearColorData,
  applyInteractionColor,
  restoreOriginalColor,
} from '../utils/color-highlighting/color-highlighting.utils';
import { findInstanceByPath } from '../utils/instance-finding/instance-finding.utils';
import { COLORS } from '../code-city.model';
import type { CityNode, InstanceData, InstanceMap, PathColorData } from '../code-city.model';

@Component({
  selector: 'app-code-city',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-city.component.scss',
  templateUrl: './code-city.component.html',
})
export class CodeCityComponent implements AfterViewInit, OnDestroy {
  private readonly logger = injectLogger('CodeCityComponent');
  private readonly ngZone = inject(NgZone);
  private readonly hostElement: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  cityNode = input<CityNode | null>(null);
  colorData = input<PathColorData[]>([]);
  autoRotate = input<boolean>(false);
  initialZoom = input<number>(250);

  selectedNode = model<string | null>(null);
  hoveredNode = model<string | null>(null);
  keyboardNavigationActive = model(false);

  protected readonly initializationFailed = signal(false);
  protected readonly hoveredNodeName = signal<string | null>(null);
  protected readonly pointerInside = signal(false);
  protected readonly cursorPosition = signal({ x: 0, y: 0 });

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly cityRenderer = new CodeCityRenderer();
  private pointerTarget: HTMLElement | null = null;
  private pointerFrameId: number | null = null;
  private latestCursorPosition = { x: 0, y: 0 };
  private latestClientPosition = { x: 0, y: 0 };
  private isPointerInside = false;
  private viewInitialized = false;
  private activeCityNode: CityNode | null = null;
  private interactionController: InteractionController | null = null;
  private hoveredInstance: InstanceData | null = null;
  private selectedInstance: InstanceData | null = null;
  private readonly instanceMap: InstanceMap = new Map();
  private readonly rotationCenter = new THREE.Vector3(0, 0, 0);
  private readonly controls: CameraControls = createCameraControls(this.initialZoom());
  private readonly keydownHandler = (event: KeyboardEvent): void => this.handleKeyPress(event);
  private readonly pointerLeaveHandler = (): void => this.handlePointerLeave();
  private readonly pointerMoveHandler = (event: PointerEvent): void =>
    this.handlePointerMove(event);

  constructor() {
    effect(() => {
      const cityNode = this.cityNode();
      untracked(() => {
        if (this.viewInitialized && cityNode !== this.activeCityNode) {
          this.updateCity(cityNode);
        }
      });
    });

    effect(() => {
      this.selectCityNodeByPath(this.selectedNode());
    });

    effect(() => {
      this.setCityNodeHoverByPath(this.hoveredNode());
    });

    effect(() => {
      const colorData = this.colorData();
      clearColorData(this.instanceMap);
      if (colorData.length > 0) {
        applyColorData(colorData, this.instanceMap);
      }
    });

    effect(() => {
      if (this.autoRotate()) {
        this.controls.lastInteractionTime = Date.now() - AUTO_ROTATE_DELAY;
      }
    });
  }

  ngAfterViewInit(): void {
    this.startPointerTracking();
    this.viewInitialized = true;
    this.updateCity(this.cityNode());
    window.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy(): void {
    this.stopPointerTracking();
    this.cleanup();
    window.removeEventListener('keydown', this.keydownHandler);
  }

  private cleanup(): void {
    this.interactionController?.destroy();
    this.interactionController = null;
    this.resetCityNodeHover(false);
    this.deselectCityNode(false);
    this.cityRenderer.destroy();
    this.clearSelection();
  }

  private clearSelection(): void {
    this.hoveredInstance = null;
    this.selectedInstance = null;
    this.rotationCenter.copy(this.controls.targetCenter);
    this.instanceMap.clear();
  }

  private updateCity(cityNode: CityNode | null): void {
    if (cityNode === this.activeCityNode) return;

    this.cleanup();
    this.activeCityNode = cityNode;
    this.initializationFailed.set(false);
    if (!cityNode) return;

    try {
      this.initThreeJS(cityNode);
    } catch (error) {
      this.logger.error('City initialization failed', { error });
      this.cleanup();
      this.initializationFailed.set(true);
    }
  }

  private startPointerTracking(): void {
    this.pointerTarget = this.hostElement;
    this.ngZone.runOutsideAngular(() => {
      this.pointerTarget?.addEventListener('pointermove', this.pointerMoveHandler, {
        passive: true,
      });
      this.pointerTarget?.addEventListener('pointerleave', this.pointerLeaveHandler);
    });
  }

  private stopPointerTracking(): void {
    this.pointerTarget?.removeEventListener('pointermove', this.pointerMoveHandler);
    this.pointerTarget?.removeEventListener('pointerleave', this.pointerLeaveHandler);
    this.pointerTarget = null;

    if (this.pointerFrameId !== null) {
      cancelAnimationFrame(this.pointerFrameId);
      this.pointerFrameId = null;
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    const wrapper = this.hostElement.querySelector<HTMLDivElement>('.code-city-wrapper');
    const bounds = wrapper?.getBoundingClientRect();
    if (!bounds) return;

    this.latestClientPosition = { x: event.clientX, y: event.clientY };
    this.latestCursorPosition = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    this.isPointerInside = true;

    if (this.hoveredNodeName()) this.scheduleCursorUpdate();
  }

  private handlePointerLeave(): void {
    this.isPointerInside = false;
    if (this.pointerFrameId !== null) {
      cancelAnimationFrame(this.pointerFrameId);
      this.pointerFrameId = null;
    }

    if (this.pointerInside()) {
      this.ngZone.run(() => this.pointerInside.set(false));
    }
  }

  private scheduleCursorUpdate(): void {
    if (this.pointerFrameId !== null) return;

    this.pointerFrameId = requestAnimationFrame(() => {
      this.pointerFrameId = null;
      if (!this.isPointerInside || !this.hoveredNodeName()) return;

      const position = this.latestCursorPosition;
      this.ngZone.run(() => this.cursorPosition.set(position));
    });
  }

  private selectCityNode(instanceData: InstanceData, notify: boolean): void {
    if (this.selectedInstance && this.selectedInstance !== instanceData) {
      restoreOriginalColor(this.selectedInstance);
    }

    this.selectedInstance = instanceData;
    const mesh = instanceData.mesh;
    applyInteractionColor(instanceData, COLORS.selected);

    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceData.instanceIndex, matrix);
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    this.controls.targetCenter.copy(position);
    setRotationCenter(this.rotationCenter, position);

    const camera = this.cityRenderer.sceneResources?.camera;
    if (camera) {
      this.controls.targetZoom = calculateOptimalZoom(instanceData, camera);
    }
    this.controls.lastInteractionTime = Date.now();

    if (notify) {
      this.selectedNode.set(instanceData.node.path);
      this.selectedNode.set(instanceData.node.path);
    }
  }

  private deselectCityNode(notify: boolean): void {
    if (this.selectedInstance) {
      restoreOriginalColor(this.selectedInstance);
      this.selectedInstance = null;
    }

    this.controls.targetCenter.set(0, 0.5, 0);
    setRotationCenter(this.rotationCenter, this.controls.targetCenter);
    this.controls.targetZoom = this.initialZoom();

    if (notify) {
      this.selectedNode.set(null);
      this.selectedNode.set(null);
    }
  }

  private selectCityNodeByPath(path: string | null): boolean {
    if (!path) {
      this.deselectCityNode(false);
      return true;
    }

    const targetData = findInstanceByPath(this.instanceMap, path);
    if (!targetData) return false;

    this.selectCityNode(targetData, false);
    return true;
  }

  private setCityNodeHover(instanceData: InstanceData | null, notify: boolean): void {
    this.hoveredInstance = instanceData;
    this.hoveredNodeName.set(instanceData?.node.name ?? null);
    this.pointerInside.set(this.isPointerInside);
    if (instanceData && this.isPointerInside) {
      this.cursorPosition.set(this.latestCursorPosition);
    }

    if (instanceData && instanceData !== this.selectedInstance) {
      applyInteractionColor(instanceData, COLORS.hover);

      if (notify) {
        this.hoveredNode.set(instanceData.node.path);
        this.hoveredNode.set(instanceData.node.path);
      }
    }
  }

  private resetCityNodeHover(notify: boolean): void {
    const previousHoveredObject = this.hoveredInstance;
    if (previousHoveredObject && previousHoveredObject !== this.selectedInstance) {
      restoreOriginalColor(previousHoveredObject);
    }
    this.hoveredInstance = null;
    this.hoveredNodeName.set(null);

    if (notify) {
      this.hoveredNode.set(null);
      this.hoveredNode.set(null);
    }
  }

  private setCityNodeHoverByPath(path: string | null): boolean {
    if (!path) {
      this.resetCityNodeHover(false);
      return true;
    }

    const targetData = findInstanceByPath(this.instanceMap, path);
    if (!targetData) return false;

    this.resetCityNodeHover(false);
    this.setCityNodeHover(targetData, false);
    return true;
  }

  private initThreeJS(data: CityNode): void {
    const rootData = this.cityRenderer.initialize(
      this.containerRef().nativeElement,
      data,
      this.initialZoom(),
      this.instanceMap,
      this.hostElement,
      () => {
        if (this.isPointerInside) {
          this.interactionController?.restorePointerPosition(
            this.latestClientPosition.x,
            this.latestClientPosition.y,
          );
        }
      },
    );
    const resources = this.cityRenderer.sceneResources;
    if (!rootData || !resources) return;

    const optimalZoom = calculateInitialZoom(rootData, resources.camera);
    this.controls.zoom = optimalZoom;
    this.controls.targetZoom = optimalZoom;
    applyColorData(this.colorData(), this.instanceMap);

    this.interactionController = new InteractionController({
      canvas: resources.renderer.domElement,
      camera: resources.camera,
      scene: resources.scene,
      raycaster: resources.raycaster,
      mouse: resources.mouse,
      meshes: this.cityRenderer.meshes,
      instanceMap: this.instanceMap,
      controls: this.controls,
      initialZoom: () => this.initialZoom(),
      selectedInstance: () => this.selectedInstance,
      hoveredInstance: () => this.hoveredInstance,
      isHoverSuspended: () => this.keyboardNavigationActive(),
      onPointerActivity: () => this.keyboardNavigationActive.set(false),
      onSelect: (instanceData) => {
        if (!instanceData) {
          this.deselectCityNode(true);
        } else if (instanceData !== this.selectedInstance) {
          this.selectCityNode(instanceData, true);
        }
      },
      onHover: (instanceData) => {
        this.resetCityNodeHover(true);
        this.setCityNodeHover(instanceData, true);
      },
    });

    this.selectCityNodeByPath(this.selectedNode());
    this.setCityNodeHoverByPath(this.hoveredNode());

    this.cityRenderer.start(
      this.controls,
      () => this.autoRotate(),
      () => this.interactionController?.checkHover(),
    );
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.deselectCityNode(true);
    }
  }
}
