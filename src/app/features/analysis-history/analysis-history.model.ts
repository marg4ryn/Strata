import type { AnalysisTarget } from '@app/features/analysis-run';

export interface AnalysisHistoryEntry {
  analysisId: string;
  completedAt: number;
  target: AnalysisTarget;
}
