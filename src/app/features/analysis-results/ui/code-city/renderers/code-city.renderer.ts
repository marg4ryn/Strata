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
  ): ProcessedNode | null {
    const resources = createScene(container, initialZoom);
    if (!resources) return null;

    this.container = container;
    this.resources = resources;

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
}
