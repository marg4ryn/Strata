import { inject, Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import type {
  RepositorySummary,
  RepositoryDetails,
  RepositoryTrends,
  AuthorStatistics,
  AuthorCoupling,
} from '../../analysis-results.model';

@Service()
export class AnalysisResultsService {
  private readonly logger = injectLogger('AnalysisResultsService');
  private readonly cachedFetcher = inject(AnalysisResultsCachedFetcherService);
  private readonly api = inject(AnalysisResultsApiService);

  private readonly apiVersion = 'v1';

  async getRepositorySummary(analysisId: string): Promise<RepositorySummary> {
    this.logger.info('Fetching repository summary data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const [details, trends, authors] = await Promise.all([
      this.cachedFetcher.getOrFetch<RepositoryDetails>(cacheName, '/repository-details', () =>
        this.api.fetchRepositoryDetails(analysisId),
      ),
      this.cachedFetcher.getOrFetch<RepositoryTrends[]>(cacheName, '/repository-trends', () =>
        this.api.fetchRepositoryTrends(analysisId),
      ),
      this.cachedFetcher.getOrFetch<AuthorStatistics[]>(cacheName, '/author-statistics', () =>
        this.api.fetchAuthorStatistics(analysisId),
      ),
    ]);

    return { details, trends, authors };
  }

  async getDeveloperRelationships(analysisId: string): Promise<AuthorCoupling[]> {
    this.logger.info('Fetching developer relationships data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const coupling = await this.cachedFetcher.getOrFetch<AuthorCoupling[]>(
      cacheName,
      '/developer-relationships',
      () => this.api.fetchDeveloperRelationships(analysisId),
    );

    return coupling;
  }
}
