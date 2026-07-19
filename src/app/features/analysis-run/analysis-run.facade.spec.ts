import { TestBed } from '@angular/core/testing';

import { AnalysisRunFacade } from './analysis-run.facade';

describe('AnalysisRunFacade', () => {
  let service: AnalysisRunFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalysisRunFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
