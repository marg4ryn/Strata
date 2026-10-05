import { inject, Service } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import type {
  KnowledgeRisksDetails,
  RepositorySummary,
  RepositoryDetails,
  RepositoryTrends,
  AuthorStatistics,
  HotspotsDetails,
  CodeAgeDetails,
  AuthorCoupling,
  FileExtension,
  FileDetails,
  CityNode,
  CityItem,
  CodeCityData,
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

  async getCodeCityData(analysisId: string): Promise<CodeCityData> {
    this.logger.info('Fetching code city data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const [cityNode, cityItems] = await Promise.all([
      this.cachedFetcher.getOrFetch<CityNode>(cacheName, '/city-node', () =>
        this.api.fetchCityNode(analysisId),
      ),
      this.cachedFetcher.getOrFetch<CityItem[]>(cacheName, '/city-items', () =>
        this.api.fetchCityItems(analysisId),
      ),
    ]);

    return { cityNode, cityItems };
  }

  async getFileExtensions(analysisId: string): Promise<FileExtension[]> {
    this.logger.info('Fetching file extensions data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const fileExtensions = await this.cachedFetcher.getOrFetch<FileExtension[]>(
      cacheName,
      '/file-extensions',
      () => this.api.fetchFileExtensions(analysisId),
    );

    return fileExtensions;
  }

  async getFileDetails(analysisId: string, filePath: string): Promise<FileDetails> {
    this.logger.info('Fetching file details data', { analysisId, filePath });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;
    const cacheKey = `/file-details/${encodeURIComponent(filePath)}`;

    const fileDetails = await this.cachedFetcher.getOrFetch<FileDetails>(cacheName, cacheKey, () =>
      this.api.fetchFileDetails(analysisId, filePath),
    );

    return fileDetails;
  }

  async getHotspotsDetails(analysisId: string): Promise<HotspotsDetails[]> {
    this.logger.info('Fetching hotspots data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const hotspotsDetails = await this.cachedFetcher.getOrFetch<HotspotsDetails[]>(
      cacheName,
      '/hotspots-details',
      () => this.api.fetchHotspotsDetails(analysisId),
    );

    return hotspotsDetails;
  }

  async getCodeAgeDetails(analysisId: string): Promise<CodeAgeDetails[]> {
    this.logger.info('Fetching code age data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const codeAgeDetails = await this.cachedFetcher.getOrFetch<CodeAgeDetails[]>(
      cacheName,
      '/code-age-details',
      () => this.api.fetchCodeAgeDetails(analysisId),
    );

    return codeAgeDetails;
  }

  async getKnowledgeRisksDetails(analysisId: string): Promise<KnowledgeRisksDetails[]> {
    this.logger.info('Fetching code age data', { analysisId });

    const cacheName = `analysis:${analysisId}:${this.apiVersion}`;

    const knowledgeRisksDetails = await this.cachedFetcher.getOrFetch<KnowledgeRisksDetails[]>(
      cacheName,
      '/knowledge-risks-details',
      () => this.api.fetchKnowledgeRisksDetails(analysisId),
    );

    return knowledgeRisksDetails;
  }
}
