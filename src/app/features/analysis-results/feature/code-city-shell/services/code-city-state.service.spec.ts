import { TestBed } from '@angular/core/testing';
import { CodeCityStateService } from './code-city-state.service';

describe.skip('CodeCityStateService', () => {
  let service: CodeCityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeCityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
