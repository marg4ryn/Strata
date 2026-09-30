import { BoxGeometry } from 'three';
import type { InstancedMesh } from 'three';

import type { CityNode } from '@app/features/analysis-results/analysis-results.model';

export type { CityNode } from '@app/features/analysis-results/analysis-results.model';

export type InstanceMap = Map<string, InstanceData>;
export type InstanceType = 'building' | 'platform';

export interface InstanceData {
  node: CityNode;
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

export const COLORS = {
  building: 0xffffff,
  platform: 0xffffff,
  edge: 0x000000,
  emissiveColor: 0x000000,
  selected: 0xffd700,
  hover: 0xffff00,
} as const;

export const UNIT_CUBE = new BoxGeometry(1, 1, 1);
