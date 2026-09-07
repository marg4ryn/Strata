import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { Mock } from 'vitest';

import { AnalysisResultsFacade } from './analysis-results.facade';
import { AnalysisResultsService } from './data-access/analysis-results/analysis-results.service';

describe('AnalysisResultsFacade', () => {
  const analysisId = '123';

  let service: AnalysisResultsFacade;
  let analysisResults: { getRepositorySummary: Mock };
  let router: { navigate: Mock };

  beforeEach(() => {
    analysisResults = { getRepositorySummary: vi.fn() };
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
});
