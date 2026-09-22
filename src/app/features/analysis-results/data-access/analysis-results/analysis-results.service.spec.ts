import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';
import type { Mock } from 'vitest';

import { LoggerService, ContextLogger } from '@app/core/logging';
import { AnalysisResultsService } from './analysis-results.service';
import { CACHE_CONFIG } from '../analysis-results-cached-fetcher/cache.config';
import type { CacheConfig } from '../analysis-results-cached-fetcher/cache.config';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';

describe('AnalysisResultsService', () => {
  const analysisId = '123';

  let service: AnalysisResultsService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;
  let config: CacheConfig;
  let cachedFetcher: { getOrFetch: Mock };
  let api: {
    fetchRepositoryDetails: Mock;
    fetchRepositoryTrends: Mock;
    fetchAuthorStatistics: Mock;
    fetchDeveloperRelationships: Mock;
  };

  beforeEach(() => {
    cachedFetcher = { getOrFetch: vi.fn() };
    cachedFetcher.getOrFetch.mockImplementation(
      (_cacheName: string, _cacheKey: string, fetcher: () => Promise<unknown>) => fetcher(),
    );

    logger = MockService(ContextLogger);
    config = { maxCaches: 2, registryCacheName: 'test-reg', registryKey: '/test' };
    api = {
      fetchRepositoryDetails: vi.fn(),
      fetchRepositoryTrends: vi.fn(),
      fetchAuthorStatistics: vi.fn(),
      fetchDeveloperRelationships: vi.fn(),
    };

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalysisResultsCachedFetcherService, useValue: cachedFetcher },
        { provide: AnalysisResultsApiService, useValue: api },
        { provide: LoggerService, useValue: loggerService },
        { provide: CACHE_CONFIG, useValue: config },
      ],
    });

    service = TestBed.inject(AnalysisResultsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRepositorySummary', () => {
    it('calls getOrFetch with correct cache keys for all 3 endpoints', async () => {
      api.fetchRepositoryDetails.mockResolvedValue({});
      api.fetchRepositoryTrends.mockResolvedValue({});
      api.fetchAuthorStatistics.mockResolvedValue({});

      await service.getRepositorySummary(analysisId);

      const expectedCacheName = expect.stringContaining(`analysis:${analysisId}`);

      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expectedCacheName,
        '/repository-details',
        expect.any(Function),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expectedCacheName,
        '/repository-trends',
        expect.any(Function),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expectedCacheName,
        '/author-statistics',
        expect.any(Function),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledTimes(3);
    });

    it('calls the api with analysisId for each endpoint', async () => {
      api.fetchRepositoryDetails.mockResolvedValue({});
      api.fetchRepositoryTrends.mockResolvedValue({});
      api.fetchAuthorStatistics.mockResolvedValue({});

      await service.getRepositorySummary(analysisId);

      expect(api.fetchRepositoryDetails).toHaveBeenCalledWith(analysisId);
      expect(api.fetchRepositoryTrends).toHaveBeenCalledWith(analysisId);
      expect(api.fetchAuthorStatistics).toHaveBeenCalledWith(analysisId);
    });

    it('combines results from 3 sources into a single object', async () => {
      const details = { name: 'test-repo' };
      const trends = [{ commits: 2 }];
      const authors = [{ name: 'John Doe' }];

      api.fetchRepositoryDetails.mockResolvedValue(details);
      api.fetchRepositoryTrends.mockResolvedValue(trends);
      api.fetchAuthorStatistics.mockResolvedValue(authors);

      const result = await service.getRepositorySummary(analysisId);

      expect(result).toEqual({ details, trends, authors });
    });

    it('propagates an error when one of the fetches fails', async () => {
      api.fetchRepositoryDetails.mockResolvedValue({});
      api.fetchRepositoryTrends.mockRejectedValue(new Error('Network error'));
      api.fetchAuthorStatistics.mockResolvedValue({});

      await expect(service.getRepositorySummary(analysisId)).rejects.toThrow('Network error');
    });
  });

  describe('getDeveloperRelationships', () => {
    it('calls getOrFetch with correct cache keys', async () => {
      api.fetchDeveloperRelationships.mockResolvedValue({});

      await service.getDeveloperRelationships(analysisId);

      const expectedCacheName = expect.stringContaining(`analysis:${analysisId}`);

      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expectedCacheName,
        '/developer-relationships',
        expect.any(Function),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledTimes(1);
      expect(api.fetchDeveloperRelationships).toHaveBeenCalledWith(analysisId);
    });

    it('propagates an error when one of the fetches fails', async () => {
      api.fetchDeveloperRelationships.mockRejectedValue(new Error('Network error'));
      await expect(service.getDeveloperRelationships(analysisId)).rejects.toThrow('Network error');
    });
  });
});
