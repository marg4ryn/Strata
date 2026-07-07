import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisRunPage } from './analysis-run-page.component';

describe('AnalysisRunPage', () => {
  let component: AnalysisRunPage;
  let fixture: ComponentFixture<AnalysisRunPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisRunPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisRunPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
