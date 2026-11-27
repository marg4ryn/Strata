import type { InstancedMesh } from 'three';

import type { CityNode } from '@app/features/analysis-results/models/code-city.model';

export type { CityNode } from '@app/features/analysis-results/models/code-city.model';

export type InstanceMap = Map<string, InstanceData>;
export type InstancePathMap = Map<string, InstanceData>;
export type InstanceType = 'building' | 'platform';

export interface InstanceData {
  node: CityNode;
  width: number;
  depth: number;
  type: InstanceType;
  instanceIndex: number;
  mesh: InstancedMesh;
}

export interface ProcessedNode {
  width: number;
  depth: number;
  height: number;
  children: ProcessedNode[];
  positions: NodePosition[];
}

export interface NodePosition {
  centerX: number;
  centerZ: number;
}

export interface ColorData {
  color: number;
  intensity: number;
}

export interface PathColorData extends ColorData {
  path: string;
}
