import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';

@Service()
export class AnalysisResultsFacade {
  private readonly router = inject(Router);

  navigateToAnalysis(analysisId: string): void {
    this.router.navigate(['analysis', analysisId, 'summary']);
  }
}
