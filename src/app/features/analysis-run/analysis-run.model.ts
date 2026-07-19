import type { ISODateString } from '@app/shared/date-utils/date.utils';

export enum AnalysisStatus {
  QUEUED = 'Queued',
  CLONING = 'Cloning',
  UPDATING = 'Updating',
  PROCESSING_DATA = 'Processing data',
  ANALYZING = 'Analyzing',
  FINALIZING = 'Finalizing',
}

export type AnalysisStatusKey = keyof typeof AnalysisStatus;

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
