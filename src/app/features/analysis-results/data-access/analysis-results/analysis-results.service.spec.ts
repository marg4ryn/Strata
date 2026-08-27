import { TestBed } from '@angular/core/testing';

import { AnalysisResultsService } from './analysis-results.service';

describe('AnalysisResultsService', () => {
  let service: AnalysisResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
