import * as THREE from 'three';

import {
  addBoxEdgesToMerge,
  createEdgesMesh,
} from '../utils/edge-generating/edge-generating.utils';
import type { EdgeInfo } from '../utils/edge-generating/edge-generating.utils';
import { createAllInstancedMeshes } from '../utils/mesh-instancing/mesh-instancing.utils';
import type { InstanceBuffer } from '../utils/mesh-instancing/mesh-instancing.utils';
import { disposeMesh, disposeMeshes } from '../utils/resource-disposing/resource-disposing.utils';
import type {
  CityNode,
  InstanceData,
  InstanceMap,
  InstanceType,
  ProcessedNode,
} from '../code-city.model';

export interface CodeCityGeometry {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  edges: THREE.InstancedMesh;
}

export class GeometryBuilder {
  build(node: CityNode, nodeData: ProcessedNode, instanceMap: InstanceMap): CodeCityGeometry {
    const instanceBuffer: InstanceBuffer = { building: [], platform: [] };
    const edgeBuffer: EdgeInfo[] = [];
    const mapChanges: { key: string; previous: InstanceData | undefined }[] = [];
    let meshes: THREE.InstancedMesh[] = [];
    let edges: THREE.InstancedMesh | null = null;

    try {
      this.collectGeometry(node, nodeData, { x: 0, y: 0, z: 0 }, instanceBuffer, edgeBuffer);

      edges = createEdgesMesh(edgeBuffer);
      const generated = createAllInstancedMeshes(instanceBuffer);
      meshes = generated.meshes;

      for (const [key, value] of generated.instanceEntries) {
        mapChanges.push({ key, previous: instanceMap.get(key) });
        instanceMap.set(key, value);
      }

      return { group: generated.group, meshes, edges };
    } catch (error) {
      for (const { key, previous } of mapChanges.reverse()) {
        if (previous) {
          instanceMap.set(key, previous);
        } else {
          instanceMap.delete(key);
        }
      }

      disposeMeshes(meshes);
      if (edges) disposeMesh(edges);
      throw new Error('Failed to build city geometry', { cause: error });
    }
  }

  private collectGeometry(
    node: CityNode,
    nodeData: ProcessedNode,
    baseCenter: THREE.Vector3Like,
    instanceBuffer: InstanceBuffer,
    edgeBuffer: EdgeInfo[],
  ): void {
    const type: InstanceType =
      node.height !== undefined && node.width !== undefined ? 'building' : 'platform';
    const matrix = new THREE.Matrix4()
      .makeScale(nodeData.width, nodeData.height, nodeData.depth)
      .setPosition(baseCenter.x, baseCenter.y + nodeData.height / 2, baseCenter.z);

    instanceBuffer[type].push({ node, matrix });
    addBoxEdgesToMerge(edgeBuffer, matrix);

    if (type === 'building') return;

    const originX = baseCenter.x - nodeData.width / 2;
    const originZ = baseCenter.z - nodeData.depth / 2;
    const childY = baseCenter.y + nodeData.height;

    node.children?.forEach((child, index) => {
      const { centerX, centerZ } = nodeData.positions[index];
      this.collectGeometry(
        child,
        nodeData.children[index],
        { x: originX + centerX, y: childY, z: originZ + centerZ },
        instanceBuffer,
        edgeBuffer,
      );
    });
  }
}
