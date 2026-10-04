import type { ISODateString } from '@app/shared/utils';

export const KNOWLEDGE_RISKS = [
  'ABANDONED',
  'SINGLE_OWNER',
  'BALANCED',
  'DIFFUSED',
  'UNKNOWN',
] as const;
export type KnowledgeRisk = (typeof KNOWLEDGE_RISKS)[number];

export interface FileInfo {
  path: string;
  name: string;
  type: string | null;
  size: string;
  url: string;
  totalLines: number | null;
  codeLines: number | null;
  commentLines: number | null;
  blankLines: number | null;
  totalCommits: number | null;
  commitsLastMonth: number;
  commitsLastYear: number;
  firstCommitDate: ISODateString;
  lastCommitDate: ISODateString;
  codeAgeDays: number;
}

export interface FileKnowledge {
  totalLinesAdded: number | null;
  leadAuthor: string | null;
  leadAuthorPercentage: number | null;
  authors: number;
  activeAuthors: number | null;
  knowledgeLoss: number;
  knowledgeRisk: KnowledgeRisk;
  contributions: AuthorContribution[];
}

export interface AuthorContribution {
  name: string;
  percentage: number;
  linesAdded: number;
  commits: number;
}

export interface StaticAnalysis {
  bugs: number;
  vulnerabilities: number;
  codeSmells: number;
  complexity: number;
  duplicatedLinesDensity: number;
}

export interface FileDetails {
  info: FileInfo;
  knowledge: FileKnowledge | null;
  staticAnalysis: StaticAnalysis | null;
}
