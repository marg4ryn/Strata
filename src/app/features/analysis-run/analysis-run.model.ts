import type { ISODateString } from '@app/shared/date-utils/date.utils';

export enum AnalysisStatus {
  QUEUED = 'analysisRun.progress.queued',
  CLONING = 'analysisRun.progress.cloning',
  UPDATING = 'analysisRun.progress.updating',
  PROCESSING_DATA = 'analysisRun.progress.processing',
  ANALYZING = 'analysisRun.progress.analyzing',
  FINALIZING = 'analysisRun.progress.finalizing',
}

export type AnalysisStatusKey = keyof typeof AnalysisStatus;

export type ErrorType = 'server' | 'connection';

export interface AnalysisTargetFormModel {
  targetURL: string;
  limitRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRange {
  startDate: ISODateString;
  endDate: ISODateString;
  timezone: string; // IANA name, e.g. "Europe/Warsaw" - context for both dates above
}

export interface AnalysisTarget {
  targetURL: string;
  limitRange: boolean;
  range: DateRange | null;
}

export interface PendingAnalysis {
  sessionId: string;
  startedAt: number;
  target: AnalysisTarget;
}
