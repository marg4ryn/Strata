import { TestBed } from '@angular/core/testing';

import { HttpService } from '@app/core/http/http.service';
import { AnalysisResultsApiService } from './analysis-results-api.service';
import { CACHE_CONFIG, CacheConfig } from '../analysis-results-cached-fetcher/cache.config';

describe('AnalysisResultsApiService', () => {
  let service: AnalysisResultsApiService;
  let config: CacheConfig;

  let http: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = {
      get: vi.fn(),
    };

    config = {
      maxCaches: 2,
      registryCacheName: 'test-reg',
      registryKey: '/test',
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpService, useValue: http },
        { provide: CACHE_CONFIG, useValue: config },
      ],
    });
    service = TestBed.inject(AnalysisResultsApiService);
  });

  const analysisId = '123';

  it('handles fetchRepositoryDetails', () => {
    service.fetchRepositoryDetails(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/summary`);
  });

  it('handles fetchRepositoryTrends', () => {
    service.fetchRepositoryTrends(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/trends`);
  });

  it('handles fetchAuthorStatistics', () => {
    service.fetchAuthorStatistics(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/authors/statistics`);
  });
});
