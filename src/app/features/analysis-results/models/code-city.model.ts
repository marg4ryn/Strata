export interface CityNode {
  name: string;
  type: string;
  path: string;
  height?: number;
  width?: number;
  children?: CityNode[];
}

export interface CityItem {
  path: string;
  name: string;
  type: string;
}

export interface CodeCityData {
  cityNode: CityNode;
  cityItems: CityItem[];
}
