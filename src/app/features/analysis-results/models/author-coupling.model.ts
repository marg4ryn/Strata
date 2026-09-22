export interface AuthorCoupling {
  name: string;
  filesChanged: number;
  totalChanges: number;
  coupledAuthors: CoupledAuthor[];
}

export interface CoupledAuthor {
  name: string;
  percentage: number;
  sharedChanges: number;
  sharedFilesChanged: number;
}
