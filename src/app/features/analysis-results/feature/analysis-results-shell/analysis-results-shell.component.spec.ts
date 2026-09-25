import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { getTranslocoModule } from '@app/core/transloco';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { AnalysisResultsShellComponent } from './analysis-results-shell.component';

const summary = {
  details: {
    info: {
      repositoryName: 'repository',
      repositoryOwner: 'example',
      analysisRangeStartDate: '2026-01-01',
      analysisRangeEndDate: '2026-01-31',
    },
  },
};

describe('AnalysisResultsShellComponent', () => {
  let component: AnalysisResultsShellComponent;
  let fixture: ComponentFixture<AnalysisResultsShellComponent>;
  let facade: { getRepositorySummary: Mock };

  beforeEach(async () => {
    facade = { getRepositorySummary: vi.fn().mockResolvedValue(summary) };

    await TestBed.configureTestingModule({
      imports: [AnalysisResultsShellComponent, getTranslocoModule()],
      providers: [{ provide: AnalysisResultsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultsShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'analysis-1');
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('computes repo name', async () => {
    expect(component.repoName()).toBe(
      `${summary.details.info.repositoryOwner}/${summary.details.info.repositoryName}`,
    );
  });

  it('computes date range', async () => {
    expect(component.dateRange()).toEqual({
      startDate: summary.details.info.analysisRangeStartDate,
      endDate: summary.details.info.analysisRangeEndDate,
    });
  });
});
