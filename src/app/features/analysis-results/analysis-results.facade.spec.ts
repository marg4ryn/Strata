import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { Mock } from 'vitest';

import { AnalysisResultsFacade } from './analysis-results.facade';
import { AnalysisResultsService } from './data-access/analysis-results/analysis-results.service';

describe('AnalysisResultsFacade', () => {
  const analysisId = '123';

  let service: AnalysisResultsFacade;
  let analysisResults: {
    getRepositorySummary: Mock;
    getDeveloperRelationships: Mock;
    getCodeCityData: Mock;
    getFileExtensions: Mock;
  };
  let router: { navigate: Mock };

  beforeEach(() => {
    analysisResults = {
      getRepositorySummary: vi.fn(),
      getDeveloperRelationships: vi.fn(),
      getCodeCityData: vi.fn(),
      getFileExtensions: vi.fn(),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalysisResultsService, useValue: analysisResults },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AnalysisResultsFacade);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigates to analysis', () => {
    service.navigateToAnalysis(analysisId);
    expect(router.navigate).toHaveBeenCalledWith(['analysis', analysisId, 'summary']);
  });

  it('delegates getRepositorySummary to AnalysisResultsService', () => {
    service.getRepositorySummary(analysisId);
    expect(analysisResults.getRepositorySummary).toHaveBeenCalledWith(analysisId);
  });

  it('delegates getDeveloperRelationships to AnalysisResultsService', () => {
    service.getDeveloperRelationships(analysisId);
    expect(analysisResults.getDeveloperRelationships).toHaveBeenCalledWith(analysisId);
  });

  it('delegates getCodeCityData to AnalysisResultsService', () => {
    service.getCodeCityData(analysisId);
    expect(analysisResults.getCodeCityData).toHaveBeenCalledWith(analysisId);
  });

  it('delegates getFileExtensions to AnalysisResultsService', () => {
    service.getFileExtensions(analysisId);
    expect(analysisResults.getFileExtensions).toHaveBeenCalledWith(analysisId);
  });
});
