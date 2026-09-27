import type { ISODateString } from '@app/shared/utils';

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
