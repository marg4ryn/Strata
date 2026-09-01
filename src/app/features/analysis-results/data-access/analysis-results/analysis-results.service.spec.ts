import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisResultsService } from './analysis-results.service';
import { CACHE_CONFIG, CacheConfig } from '../analysis-results-cached-fetcher/cache.config';
import { AnalysisResultsApiService } from '../analysis-results-api/analysis-results-api.service';
import { AnalysisResultsCachedFetcherService } from '../analysis-results-cached-fetcher/analysis-results-cached-fetcher.service';

describe('AnalysisResultsService', () => {
  let service: AnalysisResultsService;
  let logger: Partial<LoggerService>;
  let config: CacheConfig;

  let api: {
    fetchRepositoryDetails: ReturnType<typeof vi.fn>;
    fetchRepositoryTrends: ReturnType<typeof vi.fn>;
    fetchAuthorStatistics: ReturnType<typeof vi.fn>;
  };

  let cachedFetcher: {
    getOrFetch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      fetchRepositoryDetails: vi.fn(),
      fetchRepositoryTrends: vi.fn(),
      fetchAuthorStatistics: vi.fn(),
    };

    cachedFetcher = {
      getOrFetch: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    config = {
      maxCaches: 2,
      registryCacheName: 'test-reg',
      registryKey: '/test',
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalysisResultsCachedFetcherService, useValue: cachedFetcher },
        { provide: AnalysisResultsApiService, useValue: api },
        { provide: LoggerService, useValue: logger },
        { provide: CACHE_CONFIG, useValue: config },
      ],
    });
    service = TestBed.inject(AnalysisResultsService);
  });

  const analysisId = '123';

  describe('getRepositorySummary', () => {
    beforeEach(() => {
      cachedFetcher.getOrFetch.mockImplementation(
        (_cacheName: string, _key: string, fetcher: () => Promise<unknown>) => fetcher(),
      );
    });

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

    it('combines results from 3 sources into a single objec', async () => {
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
});
