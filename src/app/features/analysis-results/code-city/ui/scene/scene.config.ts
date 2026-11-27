import { BoxGeometry } from 'three';

export const COLORS = {
  building: 0xffffff,
  platform: 0xffffff,
  edge: 0x000000,
  emissiveColor: 0x000000,
  selected: 0xffd700,
  hover: 0xffff00,
} as const;

export const UNIT_CUBE = new BoxGeometry(1, 1, 1);
