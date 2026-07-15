import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisProgressSpinner } from './analysis-progress-spinner.component';

describe('AnalysisProgressSpinner', () => {
  let component: AnalysisProgressSpinner;
  let fixture: ComponentFixture<AnalysisProgressSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisProgressSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisProgressSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });
});
