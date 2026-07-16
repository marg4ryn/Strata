import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisUnfinishedModal } from './analysis-unfinished-modal.component';

describe('AnalysisUnfinishedModal', () => {
  let component: AnalysisUnfinishedModal;
  let fixture: ComponentFixture<AnalysisUnfinishedModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisUnfinishedModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisUnfinishedModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
