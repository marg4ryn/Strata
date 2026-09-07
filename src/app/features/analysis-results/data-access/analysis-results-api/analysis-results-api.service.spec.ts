import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { HttpService } from '@app/core/http/http.service';
import { AnalysisResultsApiService } from './analysis-results-api.service';

describe('AnalysisResultsApiService', () => {
  const analysisId = '123';

  let service: AnalysisResultsApiService;
  let http: { get: Mock };

  beforeEach(() => {
    http = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: HttpService, useValue: http }],
    });

    service = TestBed.inject(AnalysisResultsApiService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates fetchRepositoryDetails to HttpService', () => {
    service.fetchRepositoryDetails(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/summary`);
  });

  it('delegates fetchRepositoryTrends to HttpService', () => {
    service.fetchRepositoryTrends(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/trends`);
  });

  it('delegates fetchAuthorStatistics to HttpService', () => {
    service.fetchAuthorStatistics(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/authors/statistics`);
  });
});
