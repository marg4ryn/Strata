import { TestBed } from '@angular/core/testing';

import { AnalysisResultsCachedFetcherService } from './analysis-results-cached-fetcher.service';

describe('AnalysisResultsCachedFetcherService', () => {
  let service: AnalysisResultsCachedFetcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisResultsCachedFetcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
