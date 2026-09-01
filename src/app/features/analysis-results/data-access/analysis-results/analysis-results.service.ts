import { inject, Service } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import type {
  RepositorySummary,
  RepositoryDetails,
  RepositoryTrends,
  AuthorStatistics,
} from '../../analysis-results.model';

@Service()
export class AnalysisResultsService {
  private readonly cachedFetcher = inject(AnalysisResultsCachedFetcherService);
  private readonly api = inject(AnalysisResultsApiService);
  private readonly logger = inject(LoggerService);

  private readonly apiVersion = 'v1';

  async getRepositorySummary(analysisId: string): Promise<RepositorySummary> {
    this.logger.info(
      `Analysis Results Service received a request to fetch repository summary data for analysisId: ${analysisId}`,
    );

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const [details, trends, authors] = await Promise.all([
      this.cachedFetcher.getOrFetch<RepositoryDetails>(cacheName, '/repository-details', () =>
        this.api.fetchRepositoryDetails(analysisId),
      ),
      this.cachedFetcher.getOrFetch<RepositoryTrends>(cacheName, '/repository-trends', () =>
        this.api.fetchRepositoryTrends(analysisId),
      ),
      this.cachedFetcher.getOrFetch<AuthorStatistics>(cacheName, '/author-statistics', () =>
        this.api.fetchAuthorStatistics(analysisId),
      ),
    ]);

    return { details, trends, authors };
  }
}
