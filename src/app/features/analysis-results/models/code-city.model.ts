export interface CityNode {
  name: string;
  path: string;
  type: CityNodeType;
  height?: number;
  width?: number;
  children?: CityNode[];
}

export type CityNodeType = 'dir' | 'file';

export interface CityItem {
  path: string;
  name: string;
  type: string;
}

export interface CodeCityData {
  cityNode: CityNode;
  cityItems: CityItem[];
}
