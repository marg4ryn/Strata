import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import type { RepositoryDetails } from '../../analysis-results.model';

@Service()
export class AnalysisResultsService {
  private readonly cachedFetcher = inject(AnalysisResultsCachedFetcherService);
  private readonly api = inject(AnalysisResultsApiService);
  private readonly logger = inject(LoggerService);

  private readonly apiVersion = 'v1';

  getRepositoryDetails(analysisId: string): Promise<RepositoryDetails> {
    this.logger.info(
      `Analysis Results Service received a request to fetch repository details data for analysisId: ${analysisId}`,
    );
    return this.cachedFetcher.getOrFetch<RepositoryDetails>(
      `analysis:${analysisId}:${this.apiVersion}`,
      '/repository-details',
      () => this.api.fetchRepositoryDetails(analysisId),
    );
  }
}
