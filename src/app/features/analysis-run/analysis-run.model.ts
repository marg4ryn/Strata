import { marker } from '@jsverse/transloco-keys-manager/marker';

import type { ISODateString } from '@app/shared/utils/date.utils';

export const AnalysisStatus = {
  QUEUED: marker('analysisRun.progress.queued'),
  CLONING: marker('analysisRun.progress.cloning'),
  UPDATING: marker('analysisRun.progress.updating'),
  PROCESSING_DATA: marker('analysisRun.progress.processing'),
  ANALYZING: marker('analysisRun.progress.analyzing'),
  FINALIZING: marker('analysisRun.progress.finalizing'),
} as const;

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
