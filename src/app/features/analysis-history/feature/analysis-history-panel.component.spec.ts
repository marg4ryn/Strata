import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisHistoryPanel } from './analysis-history-panel.component';

describe('AnalysisHistoryPanel', () => {
  let component: AnalysisHistoryPanel;
  let fixture: ComponentFixture<AnalysisHistoryPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisHistoryPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisHistoryPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
