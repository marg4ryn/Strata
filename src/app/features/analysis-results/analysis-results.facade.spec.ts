import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisResultsFacade } from './analysis-results.facade';
import {
  CACHE_CONFIG,
  CacheConfig,
} from './data-access/analysis-results-cached-fetcher/cache.config';
import { AnalysisResultsService } from './data-access/analysis-results/analysis-results.service';

describe('AnalysisResultsFacade', () => {
  let service: AnalysisResultsFacade;
  let logger: Partial<LoggerService>;
  let config: CacheConfig;

  let analysisResults: {
    getRepositoryDetails: ReturnType<typeof vi.fn>;
  };

  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    analysisResults = {
      getRepositoryDetails: vi.fn(),
    };

    router = {
      navigate: vi.fn(),
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
        { provide: AnalysisResultsService, useValue: analysisResults },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: logger },
        { provide: CACHE_CONFIG, useValue: config },
      ],
    });
    service = TestBed.inject(AnalysisResultsFacade);
  });

  const analysisId = '123';

  it('navigates do analysis', () => {
    service.navigateToAnalysis(analysisId);
    expect(router.navigate).toHaveBeenCalledWith(['analysis', analysisId, 'summary']);
  });

  it('handles getRepositoryDetails', () => {
    service.getRepositoryDetails(analysisId);
    expect(analysisResults.getRepositoryDetails).toHaveBeenCalledWith(analysisId);
  });
});
