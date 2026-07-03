import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartAnalysisPage } from './start-analysis-page';

describe('WelcomePage', () => {
  let component: StartAnalysisPage;
  let fixture: ComponentFixture<StartAnalysisPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartAnalysisPage],
    }).compileComponents();

    fixture = TestBed.createComponent(StartAnalysisPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
