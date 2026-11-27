import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AnalysisResultsService } from './data-access/analysis-results/analysis-results.service';
import type { AuthorCoupling } from './models/author-coupling.model';
import type { ChangeCoupling } from './models/change-coupling.model';
import type { CodeAgeDetails } from './models/code-age.model';
import type { CodeCityData } from './models/code-city.model';
import type { FileDetails } from './models/file-details.model';
import type { FileExtension } from './models/file-extensions.model';
import type { Hotspot } from './models/hotspots.model';
import type { KnowledgeRisksDetails } from './models/knowledge-risks.model';
import type { LeadAuthorsDetails } from './models/lead-authors.model';
import type { RepositorySummary } from './models/repository-summary.model';

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

  getDeveloperRelationships(analysisId: string): Promise<AuthorCoupling[]> {
    return this.service.getDeveloperRelationships(analysisId);
  }

  getCodeCityData(analysisId: string): Promise<CodeCityData> {
    return this.service.getCodeCityData(analysisId);
  }

  getFileExtensions(analysisId: string): Promise<FileExtension[]> {
    return this.service.getFileExtensions(analysisId);
  }

  getFileDetails(analysisId: string, filePath: string): Promise<FileDetails> {
    return this.service.getFileDetails(analysisId, filePath);
  }

  getHotspots(analysisId: string): Promise<Hotspot[]> {
    return this.service.getHotspots(analysisId);
  }

  getCodeAgeDetails(analysisId: string): Promise<CodeAgeDetails[]> {
    return this.service.getCodeAgeDetails(analysisId);
  }

  getKnowledgeRisksDetails(analysisId: string): Promise<KnowledgeRisksDetails[]> {
    return this.service.getKnowledgeRisksDetails(analysisId);
  }

  getLeadAuthorsDetails(analysisId: string): Promise<LeadAuthorsDetails[]> {
    return this.service.getLeadAuthorsDetails(analysisId);
  }

  getChangeCoupling(analysisId: string): Promise<ChangeCoupling[]> {
    return this.service.getChangeCoupling(analysisId);
  }
}
