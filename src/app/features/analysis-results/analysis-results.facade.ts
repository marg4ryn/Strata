import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AnalysisResultsService } from './data-access/analysis-results/analysis-results.service';
import type { RepositorySummary } from './analysis-results.model';

@Service()
export class AnalysisResultsFacade {
  private readonly router = inject(Router);
  private readonly service = inject(AnalysisResultsService);

  navigateToAnalysis(analysisId: string): void {
    this.router.navigate(['analysis', analysisId, 'summary']);
  }

  getRepositorySummary(analysisId: string): Promise<RepositorySummary> {
    return this.service.getRepositorySummary(analysisId);
  }
}
