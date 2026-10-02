import * as THREE from 'three';

import {
  createScene,
  disposeScene,
  populateScene,
  resizeScene,
} from '../utils/scene-managing/scene-managing.utils';
import type { SceneResources } from '../utils/scene-managing/scene-managing.utils';
import { updateCamera } from '../utils/camera-controlling/camera-controlling.utils';
import type { CameraControls } from '../utils/camera-controlling/camera-controlling.utils';
import type { CityNode, InstanceMap, ProcessedNode } from '../code-city.model';

export class CodeCityRenderer {
  private resources: SceneResources | null = null;
  private container: HTMLDivElement | null = null;
  private timer: THREE.Timer | null = null;
  private animationId: number | null = null;
  private canvasObserver: MutationObserver | null = null;
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private resizeHandler: (() => void) | null = null;

  get sceneResources(): SceneResources | null {
    return this.resources;
  }

  get meshes(): THREE.InstancedMesh[] {
    return this.instancedMeshes;
  }

  initialize(
    container: HTMLDivElement,
    data: CityNode,
    initialZoom: number,
    instanceMap: InstanceMap,
    hostElement: HTMLElement,
    onCanvasRestored: () => void,
  ): ProcessedNode | null {
    const resources = createScene(container, initialZoom);
    if (!resources) return null;

    this.container = container;
    this.resources = resources;
    this.observeCanvasContainer(hostElement, onCanvasRestored);

    try {
      resources.mouse.set(Infinity, Infinity);

      const { rootData, meshes } = populateScene(data, resources.scene, instanceMap);
      this.instancedMeshes = meshes;
      return rootData;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  start(controls: CameraControls, autoRotate: () => boolean, onFrame: () => void): void {
    const resources = this.resources;
    const container = this.container;
    if (!resources || !container || this.animationId !== null) return;

    const timer = new THREE.Timer();
    this.timer = timer;

    const animate = (timestamp?: number): void => {
      this.animationId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const deltaTime = timer.getDelta();
      updateCamera(resources.camera, controls, autoRotate(), deltaTime);
      onFrame();
      resources.renderer.render(resources.scene, resources.camera);
    };
    animate();

    this.resizeHandler = () => {
      resizeScene(container, resources.camera, resources.renderer);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  destroy(): void {
    this.canvasObserver?.disconnect();
    this.canvasObserver = null;

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.timer) {
      this.timer.dispose();
      this.timer = null;
    }
    if (this.container) {
      disposeScene(this.container, this.resources?.scene ?? null, this.resources?.renderer ?? null);
    }
    this.resources = null;
    this.container = null;
    this.instancedMeshes = [];
  }

  private observeCanvasContainer(hostElement: HTMLElement, onCanvasRestored: () => void): void {
    this.canvasObserver = new MutationObserver(() => {
      const resources = this.resources;
      const container = hostElement.querySelector<HTMLDivElement>('.code-city-container');
      if (!resources || !container) return;

      const canvas = resources.renderer.domElement;
      const containerChanged = this.container !== container;
      const canvasWasDetached = !container.contains(canvas);
      if (canvasWasDetached) container.appendChild(canvas);
      this.container = container;
      if (containerChanged || canvasWasDetached) {
        resizeScene(container, resources.camera, resources.renderer);
        onCanvasRestored();
      }
    });
    this.canvasObserver.observe(hostElement, { childList: true, subtree: true });
  }
}
