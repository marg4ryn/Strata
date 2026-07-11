export interface AnalysisTarget {
  targetURL: string;
  limitRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export enum AnalysisStatus {
  QUEUED = 'Queued',
  CLONING = 'Cloning',
  UPDATING = 'Updating',
  PROCESSING_DATA = 'Processing data',
  ANALYZING = 'Analyzing',
  FINALIZING = 'Finalizing',
}

export type AnalysisStatusKey = keyof typeof AnalysisStatus;

export interface PendingAnalysis {
  sessionId: string;
  startedAt: Date;
  targetUrl: string;
}
