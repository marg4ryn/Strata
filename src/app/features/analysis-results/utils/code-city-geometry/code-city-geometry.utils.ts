import * as THREE from 'three';

import type { CityNode } from '../../analysis-results.model';
import type { ProcessedNode } from '../code-city-layout/code-city-layout.utils';

export const COLORS = {
  building: 0xf0f0f0,
  platform: 0xf0f0f0,
  emissiveColor: 0x666666,
  hover: 0xffff00,
  selected: 0xffd700,
  edge: 0x000000,
} as const;

const EDGE_THICKNESS = 0.1;

const edgesCache = new Map<string, Float32Array>();

const edgesToMerge: Array<{
  positions: Float32Array;
  matrix: THREE.Matrix4;
}> = [];

const colorDataMap = new Map<string, { color: number; intensity: number }>();

const UNIT_CUBE = new THREE.BoxGeometry(1, 1, 1);

interface InstanceInfo {
  node: CityNode;
  matrix: THREE.Matrix4;
  type: 'building' | 'platform';
}

const instances = {
  building: [] as InstanceInfo[],
  platform: [] as InstanceInfo[],
};

// ========== TWORZENIE GEOMETRII ==========
export function collectEdges(
  geometry: THREE.BoxGeometry,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
): void {
  const cacheKey = `${w}_${h}_${d}`;

  let filteredPositions = edgesCache.get(cacheKey);

  if (!filteredPositions) {
    const edges = new THREE.EdgesGeometry(geometry);
    const positions = edges.attributes['position'].array as Float32Array;
    const filtered: number[] = [];

    let minY = Infinity;
    for (let i = 1; i < positions.length; i += 3) {
      minY = Math.min(minY, positions[i]);
    }

    // Filtruj krawędzie przy podstawie
    const tolerance = 0.001;
    for (let i = 0; i < positions.length; i += 6) {
      const y1 = positions[i + 1];
      const y2 = positions[i + 4];

      if (Math.abs(y1 - minY) > tolerance || Math.abs(y2 - minY) > tolerance) {
        filtered.push(
          positions[i],
          positions[i + 1],
          positions[i + 2],
          positions[i + 3],
          positions[i + 4],
          positions[i + 5],
        );
      }
    }

    filteredPositions = new Float32Array(filtered);
    edgesCache.set(cacheKey, filteredPositions);
    edges.dispose();
  }

  const matrix = new THREE.Matrix4();
  matrix.setPosition(x, y, z);

  edgesToMerge.push({
    positions: filteredPositions,
    matrix,
  });
}

export function createMergedEdges(): THREE.InstancedMesh {
  const edgeData: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];

  edgesToMerge.forEach((edge) => {
    const vertex = new THREE.Vector3();
    for (let i = 0; i < edge.positions.length; i += 6) {
      vertex.set(edge.positions[i], edge.positions[i + 1], edge.positions[i + 2]);
      vertex.applyMatrix4(edge.matrix);
      const start = vertex.clone();

      vertex.set(edge.positions[i + 3], edge.positions[i + 4], edge.positions[i + 5]);
      vertex.applyMatrix4(edge.matrix);
      const end = vertex.clone();

      edgeData.push({ start, end });
    }
  });

  const geometry = new THREE.CylinderGeometry(EDGE_THICKNESS, EDGE_THICKNESS, 1, 4, 1);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: COLORS.edge,
  });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, edgeData.length);

  // Transformacje dla każdej instancji
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 0, 1);

  edgeData.forEach(({ start, end }, index) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    direction.normalize();
    quaternion.setFromUnitVectors(axis, direction);

    matrix.compose(midpoint, quaternion, new THREE.Vector3(1, 1, length));

    instancedMesh.setMatrixAt(index, matrix);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  edgesToMerge.length = 0;

  return instancedMesh;
}

export function createGeometry(
  node: CityNode,
  nodeData: ProcessedNode,
  x: number = 0,
  y: number = 0,
  z: number = 0,
  objectMap: Map<any, any>,
): void {
  // Jeśli to plik - zbierz instancję budynku
  if (node.height !== undefined && node.width !== undefined) {
    collectInstance('building', node, nodeData, x, y, z);
    return;
  }

  // Jeśli to folder - zbierz instancję platformy i przetwórz dzieci
  if (node.children !== undefined) {
    collectInstance('platform', node, nodeData, x, y, z);

    node.children.forEach((child, index) => {
      const pos = nodeData.positions[index];
      const childX = x - nodeData.width / 2 + pos.x;
      const childZ = z - nodeData.depth / 2 + pos.z;
      const childY = y + nodeData.height;

      createGeometry(child, nodeData.children[index], childX, childY, childZ, objectMap);
    });
  }
}

// ========== KOLORY ==========
export function applyColorData(
  colorData: Array<{ path: string; color: number; intensity: number }>,
  objectMap: Map<any, any>,
): void {
  colorDataMap.clear();
  colorData.forEach((h) => {
    colorDataMap.set(h.path, { color: h.color, intensity: h.intensity });
  });

  objectMap.forEach((data, key) => {
    if (typeof key !== 'string' || data.type !== 'building') return;

    const currentColorData = colorDataMap.get(data.node.path);
    if (!currentColorData) return;

    const mesh = data.mesh as THREE.InstancedMesh;
    const originalColor = new THREE.Color(COLORS.building);
    const targetColor = new THREE.Color(currentColorData.color);

    const resultColor = new THREE.Color();
    resultColor.lerpColors(originalColor, targetColor, currentColorData.intensity * 3);

    mesh.setColorAt(data.instanceIndex, resultColor);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
}

export function clearColorData(objectMap: Map<any, any>): void {
  colorDataMap.clear();
  const updatedMeshes = new Set<THREE.InstancedMesh>();

  objectMap.forEach((data, key) => {
    if (typeof key !== 'string' || data.type !== 'building') return;

    const mesh = data.mesh as THREE.InstancedMesh;
    mesh.setColorAt(data.instanceIndex, new THREE.Color(COLORS.building));
    updatedMeshes.add(mesh);
  });

  updatedMeshes.forEach((mesh) => {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
}

export function getColorDataForPath(
  path: string,
): { color: number; intensity: number } | undefined {
  return colorDataMap.get(path);
}

// ========== INSTANCJOWANIE ==========
function collectInstance(
  type: 'building' | 'platform',
  node: CityNode,
  nodeData: ProcessedNode,
  x: number,
  y: number,
  z: number,
): void {
  const width = nodeData.width;
  const height = nodeData.height;
  const depth = type === 'building' ? nodeData.width : nodeData.depth;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3(x, y + height / 2, z);
  const scale = new THREE.Vector3(width, height, depth);

  matrix.compose(position, new THREE.Quaternion(), scale);

  instances[type].push({ node, matrix, type });

  // Przygotuj edges
  const scaledGeometry = UNIT_CUBE.clone();
  scaledGeometry.scale(width, height, depth);
  collectEdges(scaledGeometry, x, y + height / 2, z, width, height, depth);
  scaledGeometry.dispose();
}

function createInstancedMeshForType(
  type: 'building' | 'platform',
  objectMap: Map<any, any>,
): THREE.InstancedMesh | null {
  const instanceList = instances[type];
  if (instanceList.length === 0) return null;

  const color = type === 'building' ? COLORS.building : COLORS.platform;
  const material = new THREE.MeshPhongMaterial({
    color,
    emissive: COLORS.emissiveColor,
  });

  const mesh = new THREE.InstancedMesh(UNIT_CUBE, material, instanceList.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    type,
    isInstanced: true,
    instanceKey: `${type}s`,
  };

  instanceList.forEach((instance, i) => {
    mesh.setMatrixAt(i, instance.matrix);
    mesh.setColorAt(i, new THREE.Color(color));

    objectMap.set(`${type}s_${i}`, {
      node: instance.node,
      mesh: mesh,
      instanceIndex: i,
      type,
    });
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  return mesh;
}

export function createAllInstancedMeshes(objectMap: Map<any, any>): {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
} {
  const group = new THREE.Group();
  const meshes: THREE.InstancedMesh[] = [];

  // Stwórz meshe dla obu typów
  const types: Array<'building' | 'platform'> = ['building', 'platform'];
  types.forEach((type) => {
    const mesh = createInstancedMeshForType(type, objectMap);
    if (mesh) {
      meshes.push(mesh);
      group.add(mesh);
    }
  });

  // Wyczyść po użyciu
  instances.building.length = 0;
  instances.platform.length = 0;

  return { group, meshes };
}

// ========== CZYSZCZENIE ==========
export function clearEdgesCache(): void {
  edgesToMerge.length = 0;
  edgesCache.clear();
  instances.building.length = 0;
  instances.platform.length = 0;
}

export function clearInstanceCache(): void {
  instances.building.length = 0;
  instances.platform.length = 0;
}
