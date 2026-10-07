export interface CoupledFile {
  path: string;
  sharedCommits: number;
  percentage: number;
}

export interface ChangeCoupling {
  path: string;
  coupledFiles: CoupledFile[];
}
