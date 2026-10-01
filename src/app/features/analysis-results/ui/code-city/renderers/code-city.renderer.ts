import type * as THREE from 'three';

import {
  createThreeScene,
  disposeThreeScene,
  populateThreeScene,
  resizeThreeScene,
} from '../utils/scene-managing/scene-managing.utils';
import type { ThreeSceneResources } from '../utils/scene-managing/scene-managing.utils';
import type { CameraControls } from '../utils/camera-controlling/camera-controlling.utils';
import { updateCamera } from '../utils/camera-controlling/camera-controlling.utils';
import type { CityNode, InstanceMap, ProcessedNode } from '../code-city.model';

export class CodeCityRenderer {
  private resources: ThreeSceneResources | null = null;
  private container: HTMLDivElement | null = null;
  private animationId: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private instancedMeshes: THREE.InstancedMesh[] = [];

  get sceneResources(): ThreeSceneResources | null {
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
    const resources = createThreeScene(container, initialZoom);
    if (!resources) return null;

    this.container = container;
    this.resources = resources;
    resources.mouse.set(Infinity, Infinity);

    const { rootData, meshes } = populateThreeScene(data, resources.scene, instanceMap);
    this.instancedMeshes = meshes;
    return rootData;
  }

  start(controls: CameraControls, autoRotate: () => boolean, onFrame: () => void): void {
    const resources = this.resources;
    const container = this.container;
    if (!resources || !container || this.animationId !== null) return;

    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate);
      updateCamera(resources.camera, controls, autoRotate());
      onFrame();
      resources.renderer.render(resources.scene, resources.camera);
    };
    animate();

    this.resizeHandler = () => {
      resizeThreeScene(container, resources.camera, resources.renderer);
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

    if (this.container) {
      disposeThreeScene(
        this.container,
        this.resources?.scene ?? null,
        this.resources?.renderer ?? null,
      );
    }
    this.resources = null;
    this.container = null;
    this.instancedMeshes = [];
  }
}
