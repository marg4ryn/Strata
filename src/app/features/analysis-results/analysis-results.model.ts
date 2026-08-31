export interface RepositoryDetails {
  info: RepositoryInfo;
  statistics: RepositoryStatistics;
  staticAnalysis: RepositoryStaticAnalysis;
}

export interface RepositoryInfo {
  id: string;
  repositoryUrl: string;
  repositoryName: string;
  repositoryOwner: string;
  repositoryPlatform: string;
  analysisRangeStartDate: string;
  analysisRangeEndDate: string;
  lastCommitHash: string;
  analysisStartedAt: string;
  analysisFinishedAt: string;
  analysisTimeInSeconds: number;
}

export interface RepositoryStatistics {
  authors: number;
  activeAuthors: number;
  commits: number;
  files: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  fileTypeStatistics: FileTypeStatistics[];
}

export interface FileTypeStatistics {
  fileType: string;
  files: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
}

export interface RepositoryStaticAnalysis {
  bugs: number;
  vulnerabilities: number;
  codeSmells: number;
  complexity: number;
  duplicatedLinesDensity: number;
}
