import type { ISODateString } from '@app/shared/date-utils/date.utils';

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
  analysisRangeStartDate: ISODateString;
  analysisRangeEndDate: ISODateString;
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

export interface RepositoryTrends {
  date: ISODateString;
  commits: number;
  uniqueAuthors: number;
  activeAuthors: number;
  linesAdded: number;
  linesDeleted: number;
}

export interface AuthorStatistics {
  name: string;
  emails: string[];
  firstCommitDate: ISODateString;
  lastCommitDate: ISODateString;
  isActive: boolean;
  daysSinceLastCommit: number;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  existingFilesModified: number;
  filesAsLeadAuthor: number;
}

export interface RepositorySummary {
  details: RepositoryDetails;
  trends: RepositoryTrends;
  authors: AuthorStatistics;
}
