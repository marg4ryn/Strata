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

  const setup = async (mockImpl: () => void) => {
    facade = { getRepositorySummary: vi.fn() };
    mockImpl();

    await TestBed.configureTestingModule({
      imports: [AnalysisResultsShellComponent, getTranslocoModule()],
      providers: [{ provide: AnalysisResultsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultsShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'analysis-1');
  };

  describe('when resource has value', () => {
    beforeEach(async () => {
      await setup(() => facade.getRepositorySummary.mockResolvedValue(summary));
      await fixture.whenStable();
    });

    it('creates', () => {
      expect(component).toBeTruthy();
    });

    it('computes repo name', () => {
      expect(component.repoName()).toBe(
        `${summary.details.info.repositoryOwner}/${summary.details.info.repositoryName}`,
      );
    });

    it('computes date range', () => {
      expect(component.dateRange()).toEqual({
        startDate: summary.details.info.analysisRangeStartDate,
        endDate: summary.details.info.analysisRangeEndDate,
      });
    });
  });

  describe('while resource is loading', () => {
    beforeEach(async () => {
      await setup(() => facade.getRepositorySummary.mockReturnValue(new Promise(() => {})));
      fixture.detectChanges();
    });

    it('returns empty repo name', () => {
      expect(component.repoName()).toBe('');
    });

    it('returns null date range', () => {
      expect(component.dateRange()).toBeNull();
    });
  });

  describe('when resource fails', () => {
    beforeEach(async () => {
      await setup(() => facade.getRepositorySummary.mockRejectedValue(new Error('Network error')));
      await fixture.whenStable();
    });

    it('returns empty repo name', () => {
      expect(component.repoName()).toBe('');
    });

    it('returns null date range', () => {
      expect(component.dateRange()).toBeNull();
    });
  });
});
