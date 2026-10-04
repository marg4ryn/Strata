import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { HttpService } from '@app/core/http';
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

  it('delegates fetchDeveloperRelationships to HttpService', () => {
    service.fetchDeveloperRelationships(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/authors/coupling`);
  });

  it('delegates fetchCityNode to HttpService', () => {
    service.fetchCityNode(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/structure`);
  });

  it('delegates fetchCityItems to HttpService', () => {
    service.fetchCityItems(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/items`);
  });

  it('delegates fetchFileExtensions to HttpService', () => {
    service.fetchFileExtensions(analysisId);
    expect(http.get).toHaveBeenCalledWith(`/analysis/${analysisId}/files/types`);
  });

  it('fetches file details with the file path encoded as a query parameter', () => {
    const filePath = 'src/app/file name.ts';
    service.fetchFileDetails(analysisId, filePath);
    expect(http.get).toHaveBeenCalledWith(
      `/analysis/${analysisId}/files?path=src%2Fapp%2Ffile+name.ts`,
    );
  });
});
