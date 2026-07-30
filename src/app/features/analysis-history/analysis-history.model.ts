import { AnalysisTarget } from '@app/features/analysis-run/analysis-run.model';

export interface AnalysisHistoryEntry {
  analysisId: string;
  completedAt: number;
  target: AnalysisTarget;
}
