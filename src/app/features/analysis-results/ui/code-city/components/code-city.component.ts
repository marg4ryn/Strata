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

import { CodeCityInteractionController } from '../controllers/interaction.controller';
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
import { CodeCityStateService } from '../../../feature/code-city-shell/services/code-city-state.service';
import { COLORS } from '../code-city.model';
import type { CityNode, InstanceData, InstanceMap, PathColorData } from '../code-city.model';

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
  colorData = input<PathColorData[]>([]);
  autoRotate = input<boolean>(false);
  initialZoom = input<number>(150);

  selectedNode = model<string | null>(null);
  hoveredNode = model<string | null>(null);

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private readonly cityRenderer = new CodeCityRenderer();
  private interactionController: CodeCityInteractionController | null = null;
  private hoveredObject: InstanceData | null = null;
  private selectedObject: InstanceData | null = null;
  private readonly instanceMap: InstanceMap = new Map();
  private readonly rotationCenter = new THREE.Vector3(0, 0, 0);

  private readonly controls: CameraControls = createCameraControls(this.initialZoom());

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
    this.initThreeJS();
    window.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy(): void {
    this.cleanup();
    window.removeEventListener('keydown', this.keydownHandler);
  }

  private cleanup(): void {
    this.interactionController?.destroy();
    this.interactionController = null;
    this.cityRenderer.destroy();
    this.clearSelection();
  }

  private clearSelection(): void {
    this.hoveredObject = null;
    this.selectedObject = null;
    this.rotationCenter.set(0, 0, 0);
    this.instanceMap.clear();
  }

  private selectCityNode(instanceData: InstanceData, notify: boolean): void {
    if (this.selectedObject && this.selectedObject !== instanceData) {
      restoreOriginalColor(this.selectedObject);
    }

    this.selectedObject = instanceData;
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
      this.state.selectedNode.set(instanceData.node.path);
    }
  }

  private deselectCityNode(notify: boolean): void {
    if (this.selectedObject) {
      restoreOriginalColor(this.selectedObject);
      this.selectedObject = null;
    }

    this.controls.targetCenter.set(0, 0.5, 0);
    setRotationCenter(this.rotationCenter, this.controls.targetCenter);
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

    const targetData = findInstanceByPath(this.instanceMap, path);
    if (!targetData) return false;

    this.selectCityNode(targetData, false);
    return true;
  }

  private setCityNodeHover(instanceData: InstanceData | null, notify: boolean): void {
    this.hoveredObject = instanceData;

    if (instanceData && instanceData !== this.selectedObject) {
      applyInteractionColor(instanceData, COLORS.hover);

      if (notify) {
        this.hoveredNode.set(instanceData.node.path);
        this.state.hoveredNode.set(instanceData.node.path);
      }
    }
  }

  private resetCityNodeHover(notify: boolean): void {
    const previousHoveredObject = this.hoveredObject;
    if (previousHoveredObject && previousHoveredObject !== this.selectedObject) {
      restoreOriginalColor(previousHoveredObject);
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

    const targetData = findInstanceByPath(this.instanceMap, path);
    if (!targetData) return false;

    this.resetCityNodeHover(false);
    this.setCityNodeHover(targetData, false);
    return true;
  }

  private initThreeJS(): void {
    const data = this.data();
    if (!data) return;

    const rootData = this.cityRenderer.initialize(
      this.containerRef().nativeElement,
      data,
      this.initialZoom(),
      this.instanceMap,
    );
    const resources = this.cityRenderer.sceneResources;
    if (!rootData || !resources) return;

    const optimalZoom = calculateInitialZoom(rootData, resources.camera);
    this.controls.zoom = optimalZoom;
    this.controls.targetZoom = optimalZoom;
    applyColorData(this.colorData(), this.instanceMap);

    this.interactionController = new CodeCityInteractionController({
      canvas: resources.renderer.domElement,
      camera: resources.camera,
      scene: resources.scene,
      raycaster: resources.raycaster,
      mouse: resources.mouse,
      meshes: this.cityRenderer.meshes,
      instanceMap: this.instanceMap,
      controls: this.controls,
      initialZoom: () => this.initialZoom(),
      selectedObject: () => this.selectedObject,
      hoveredObject: () => this.hoveredObject,
      onSelect: (instanceData) => {
        if (!instanceData) {
          this.deselectCityNode(true);
        } else if (instanceData !== this.selectedObject) {
          this.selectCityNode(instanceData, true);
        }
      },
      onHover: (instanceData) => {
        this.resetCityNodeHover(true);
        this.setCityNodeHover(instanceData, true);
      },
    });

    this.selectCityNodeByPath(this.state.selectedNode());
    this.setCityNodeHoverByPath(this.state.hoveredNode());

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
