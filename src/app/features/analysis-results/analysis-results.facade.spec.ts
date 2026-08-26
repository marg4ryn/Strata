import { TestBed } from '@angular/core/testing';

import { AnalysisResultsFacade } from './analysis-results.facade';

describe('AnalysisResultsFacade', () => {
  let service: AnalysisResultsFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisResultsFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
