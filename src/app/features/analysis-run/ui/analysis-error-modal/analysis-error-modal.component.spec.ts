import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisErrorModal } from './analysis-error-modal.component';

describe('AnalysisErrorModal', () => {
  let component: AnalysisErrorModal;
  let fixture: ComponentFixture<AnalysisErrorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisErrorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisErrorModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });
});
