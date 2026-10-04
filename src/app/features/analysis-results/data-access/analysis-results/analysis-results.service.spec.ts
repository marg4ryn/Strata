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
    fetchCityNode: Mock;
    fetchCityItems: Mock;
    fetchFileExtensions: Mock;
    fetchFileDetails: Mock;
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
      fetchCityNode: vi.fn(),
      fetchCityItems: vi.fn(),
      fetchFileExtensions: vi.fn(),
      fetchFileDetails: vi.fn(),
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

  describe.each([
    {
      method: 'getDeveloperRelationships' as const,
      apiMock: 'fetchDeveloperRelationships' as const,
      cacheKey: '/developer-relationships',
    },
    {
      method: 'getFileExtensions' as const,
      apiMock: 'fetchFileExtensions' as const,
      cacheKey: '/file-extensions',
    },
  ])('$method', ({ method, apiMock, cacheKey }) => {
    it('calls getOrFetch with correct cache key and analysisId', async () => {
      api[apiMock].mockResolvedValue({});

      await service[method](analysisId);

      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expect.stringContaining(`analysis:${analysisId}`),
        cacheKey,
        expect.any(Function),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledTimes(1);
      expect(api[apiMock]).toHaveBeenCalledWith(analysisId);
    });

    it('propagates an error when the fetch fails', async () => {
      api[apiMock].mockRejectedValue(new Error('Network error'));
      await expect(service[method](analysisId)).rejects.toThrow('Network error');
    });
  });

  describe.each([
    {
      method: 'getRepositorySummary' as const,
      sources: [
        {
          apiMock: 'fetchRepositoryDetails' as const,
          cacheKey: '/repository-details',
          resultKey: 'details',
        },
        {
          apiMock: 'fetchRepositoryTrends' as const,
          cacheKey: '/repository-trends',
          resultKey: 'trends',
        },
        {
          apiMock: 'fetchAuthorStatistics' as const,
          cacheKey: '/author-statistics',
          resultKey: 'authors',
        },
      ],
    },
    {
      method: 'getCodeCityData' as const,
      sources: [
        { apiMock: 'fetchCityNode' as const, cacheKey: '/city-node', resultKey: 'cityNode' },
        { apiMock: 'fetchCityItems' as const, cacheKey: '/city-items', resultKey: 'cityItems' },
      ],
    },
  ])('$method', ({ method, sources }) => {
    it(`calls getOrFetch for each of ${sources.length} endpoints with analysisId in cache name`, async () => {
      sources.forEach(({ apiMock }) => api[apiMock].mockResolvedValue({}));

      await service[method](analysisId);

      sources.forEach(({ cacheKey }) =>
        expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
          expect.stringContaining(`analysis:${analysisId}`),
          cacheKey,
          expect.any(Function),
        ),
      );
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledTimes(sources.length);
    });

    it('calls the api with analysisId for each endpoint', async () => {
      sources.forEach(({ apiMock }) => api[apiMock].mockResolvedValue({}));

      await service[method](analysisId);

      sources.forEach(({ apiMock }) => expect(api[apiMock]).toHaveBeenCalledWith(analysisId));
    });

    it('combines results from all sources into a single object', async () => {
      const values = sources.map((_, i) => ({ mockValue: i }));
      sources.forEach(({ apiMock }, i) => api[apiMock].mockResolvedValue(values[i]));

      const result = await service[method](analysisId);

      const expected = Object.fromEntries(
        sources.map(({ resultKey }, i) => [resultKey, values[i]]),
      );
      expect(result).toEqual(expected);
    });

    it('propagates an error when one of the fetches fails', async () => {
      sources.forEach(({ apiMock }) => api[apiMock].mockResolvedValue({}));
      api[sources[0].apiMock].mockRejectedValue(new Error('Network error'));

      await expect(service[method](analysisId)).rejects.toThrow('Network error');
    });
  });

  describe('getFileDetails', () => {
    const filePath = 'src/app/file name.ts';
    const fileDetails = { path: filePath };

    it('fetches file details through the cache using the encoded path as cache key', async () => {
      api.fetchFileDetails.mockResolvedValue(fileDetails);

      const result = await service.getFileDetails(analysisId, filePath);

      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        `analysis:${analysisId}:v1`,
        `/file-details/${encodeURIComponent(filePath)}`,
        expect.any(Function),
      );
      expect(api.fetchFileDetails).toHaveBeenCalledWith(analysisId, filePath);
      expect(result).toEqual(fileDetails);
    });

    it('propagates an error when fetching file details fails', async () => {
      api.fetchFileDetails.mockRejectedValue(new Error('Network error'));

      await expect(service.getFileDetails(analysisId, filePath)).rejects.toThrow('Network error');
    });
  });
});
