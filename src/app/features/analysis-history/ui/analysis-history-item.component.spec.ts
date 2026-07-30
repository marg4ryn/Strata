import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisHistoryItem } from './analysis-history-item.component';

describe.skip('AnalysisHistoryItem', () => {
  let component: AnalysisHistoryItem;
  let fixture: ComponentFixture<AnalysisHistoryItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisHistoryItem],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisHistoryItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
