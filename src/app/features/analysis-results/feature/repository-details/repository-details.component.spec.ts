import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { Mock } from 'vitest';

import { getTranslocoModule } from '@app/core/transloco';
import { RepositoryDetailsComponent } from './repository-details.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { RepositorySummary } from '../../analysis-results.model';

describe('RepositoryDetailsComponent', () => {
  let component: RepositoryDetailsComponent;
  let fixture: ComponentFixture<RepositoryDetailsComponent>;
  let facade: { getRepositorySummary: Mock };

  const summary: RepositorySummary = {
    details: {
      info: {
        id: 'analysis-1',
        repositoryUrl: 'https://github.com/example/repository',
        repositoryName: 'repository',
        repositoryOwner: 'example',
        repositoryPlatform: 'GitHub',
        analysisRangeStartDate: '2026-01-01',
        analysisRangeEndDate: '2026-01-31',
        analysisStartedAt: '2026-02-01T10:00:00.000',
        analysisFinishedAt: '2026-02-01T10:01:00.000',
        analysisTimeInSeconds: 60,
      },
      statistics: {
        authors: 3,
        activeAuthors: 2,
        commits: 10,
        files: 8,
        codeLines: 100,
        commentLines: 20,
        blankLines: 10,
        fileTypeStatistics: [
          { fileType: 'TypeScript', files: 5, codeLines: 70, commentLines: 15, blankLines: 5 },
          { fileType: 'HTML', files: 3, codeLines: 30, commentLines: 5, blankLines: 5 },
        ],
      },
      staticAnalysis: {
        bugs: 1,
        vulnerabilities: 2,
        codeSmells: 3,
        complexity: 4,
        duplicatedLinesDensity: 0.1,
      },
    },
    trends: [
      {
        date: '2026-01-03',
        commits: 2,
        uniqueAuthors: 1,
        activeAuthors: 1,
        linesAdded: 10,
        linesDeleted: 3,
      },
      {
        date: '2026-01-01',
        commits: 4,
        uniqueAuthors: 2,
        activeAuthors: 2,
        linesAdded: 20,
        linesDeleted: 5,
      },
    ],
    authors: [
      {
        name: 'Ada Lovelace',
        emails: ['ada@example.com'],
        firstCommitDate: '2026-01-01',
        lastCommitDate: '2026-01-03',
        isActive: true,
        daysSinceLastCommit: 0,
        commits: 6,
        linesAdded: 20,
        linesDeleted: 4,
        existingFilesModified: 2,
        filesAsLeadAuthor: 3,
      },
    ],
  };

  beforeEach(async () => {
    facade = { getRepositorySummary: vi.fn().mockResolvedValue(summary) };

    await TestBed.configureTestingModule({
      imports: [RepositoryDetailsComponent, getTranslocoModule()],
      providers: [
        { provide: AnalysisResultsFacade, useValue: facade },
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryDetailsComponent);
    fixture.componentRef.setInput('id', 'analysis-1');
    component = fixture.componentInstance;
  });

  it('starts with empty derived data before the resource resolves', () => {
    expect(component.commitSeries()).toEqual([]);
    expect(component.uniqueAuthorsSeries()).toEqual([]);
    expect(component.activeAuthorsSeries()).toEqual([]);
    expect(component.linesChangedSeries()).toEqual([]);
    expect(component.totalLinesSeries()).toEqual([]);
    expect(component.linesAddedSeries()).toEqual([]);
    expect(component.linesDeletedSeries()).toEqual([]);
    expect(component.fileTypesRows()).toEqual([]);
    expect(component.authorsRows()).toEqual([]);
  });

  it('loads the repository summary for the supplied id', async () => {
    fixture.componentRef.setInput('id', 'analysis-42');
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(facade.getRepositorySummary).toHaveBeenCalledWith('analysis-42');
    });
  });

  it('maps trends to chart series and table data', async () => {
    fixture.componentRef.setInput('id', 'analysis-1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.commitSeries()).toEqual([
      { date: '2026-01-03', value: 2 },
      { date: '2026-01-01', value: 4 },
    ]);
    expect(component.uniqueAuthorsSeries()).toEqual([
      { date: '2026-01-03', value: 1 },
      { date: '2026-01-01', value: 2 },
    ]);
    expect(component.activeAuthorsSeries()).toEqual([
      { date: '2026-01-03', value: 1 },
      { date: '2026-01-01', value: 2 },
    ]);
    expect(component.linesChangedSeries()).toEqual([
      { date: '2026-01-03', value: 13 },
      { date: '2026-01-01', value: 25 },
    ]);
    expect(component.linesAddedSeries()).toEqual([
      { date: '2026-01-03', value: 10 },
      { date: '2026-01-01', value: 20 },
    ]);
    expect(component.linesDeletedSeries()).toEqual([
      { date: '2026-01-03', value: -3 },
      { date: '2026-01-01', value: -5 },
    ]);
    expect(component.totalLinesSeries()).toEqual([
      { date: '2026-01-01', value: 15 },
      { date: '2026-01-03', value: 22 },
    ]);
    expect(component.fileTypesRows()).toEqual([
      [
        { value: 'TypeScript', valueType: 'text' },
        { value: 5, valueType: 'number' },
        { value: 70, valueType: 'number' },
        { value: 5, valueType: 'number' },
        { value: 15, valueType: 'number' },
      ],
      [
        { value: 'HTML', valueType: 'text' },
        { value: 3, valueType: 'number' },
        { value: 30, valueType: 'number' },
        { value: 5, valueType: 'number' },
        { value: 5, valueType: 'number' },
      ],
    ]);
    expect(component.authorsRows()).toEqual([
      [
        { value: 'Ada Lovelace', valueType: 'text' },
        { value: 6, valueType: 'number' },
        { value: 3, valueType: 'number' },
        { value: 20, valueType: 'number' },
        { value: 4, valueType: 'number' },
      ],
    ]);
  });
});
