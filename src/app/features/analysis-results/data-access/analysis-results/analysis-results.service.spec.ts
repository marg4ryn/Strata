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
  };

  let cachedFetcher: {
    getOrFetch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      fetchRepositoryDetails: vi.fn(),
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

  describe('getRepositoryDetails', () => {
    it('passes correct arguments to cached fetcher', () => {
      service.getRepositoryDetails(analysisId);
      expect(logger.info).toHaveBeenCalled();
      expect(cachedFetcher.getOrFetch).toHaveBeenCalledWith(
        expect.stringContaining(`analysis:${analysisId}`),
        '/repository-details',
        expect.any(Function),
      );
    });

    it('fetches repository details from api', async () => {
      const repositoryDetails = { name: 'test-repo' };
      api.fetchRepositoryDetails.mockResolvedValue(repositoryDetails);

      service.getRepositoryDetails(analysisId);

      const [, , fetcher] = cachedFetcher.getOrFetch.mock.calls[0];
      const result = await fetcher();

      expect(api.fetchRepositoryDetails).toHaveBeenCalledWith(analysisId);
      expect(result).toBe(repositoryDetails);
    });
  });
});
