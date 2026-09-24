import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Mock } from 'vitest';

import { getTranslocoModule } from '@app/core/transloco';
import { TableComponent } from '@app/shared/components';
import { DeveloperRelationshipsComponent } from './developer-relationships.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { AuthorCoupling } from '../../analysis-results.model';
import { ChordDiagramComponent } from '../../ui/charts/chord-diagram/chord-diagram.component';

/*
 * Note on HTML branch coverage:
 * Coverage tools may report missing branch coverage on [(x)]="y" bindings mapped to Signals/model().
 * Under the hood, Angular compiles two-way bindings with a fallback for plain properties:
 * `updateSignal(...) || updatePlainProperty(...)`
 *
 * Since we exclusively use Signals, the first condition is always true, making the fallback
 * branch (plain property assignment) dead code. This branch cannot be covered by tests
 * without artificially removing the Signal implementation. It is safe to ignore.
 */

describe('DeveloperRelationshipsComponent', () => {
  let component: DeveloperRelationshipsComponent;
  let fixture: ComponentFixture<DeveloperRelationshipsComponent>;
  let facade: { getDeveloperRelationships: Mock };

  const relationships: AuthorCoupling[] = [
    {
      name: 'Ada',
      filesChanged: 4,
      totalChanges: 10,
      coupledAuthors: [
        { name: 'Grace', percentage: 0.5, sharedChanges: 3, sharedFilesChanged: 2 },
        { name: 'Linus', percentage: 0.3, sharedChanges: 2, sharedFilesChanged: 1 },
      ],
    },
    {
      name: 'Grace',
      filesChanged: 3,
      totalChanges: 8,
      coupledAuthors: [{ name: 'Ada', percentage: 0.75, sharedChanges: 5, sharedFilesChanged: 3 }],
    },
    {
      name: 'Linus',
      filesChanged: 2,
      totalChanges: 4,
      coupledAuthors: [],
    },
  ];

  const waitForAuthorsLoaded = async () => {
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(component.authors().length).toBe(3);
    });
  };

  const getSyncedControls = () => {
    const tables = fixture.debugElement.queryAll(By.directive(TableComponent));
    const chordDiagram = fixture.debugElement.query(By.directive(ChordDiagramComponent));
    return { developerTable: tables[0], relatedTable: tables[1], chordDiagram, tables };
  };

  beforeEach(async () => {
    facade = { getDeveloperRelationships: vi.fn().mockResolvedValue(relationships) };

    await TestBed.configureTestingModule({
      imports: [DeveloperRelationshipsComponent, getTranslocoModule()],
      providers: [{ provide: AnalysisResultsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperRelationshipsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'analysis-1');
  });

  it('loads relationships for the given id and exposes them before/after resolution', async () => {
    fixture.detectChanges();
    expect(component.authors()).toEqual([]);
    expect(component.authorRows()).toEqual([]);

    await waitForAuthorsLoaded();

    expect(facade.getDeveloperRelationships).toHaveBeenCalledWith('analysis-1');
    expect(component.authors()).toEqual(relationships);
  });

  it('shows the no-data message when there are no relationships', async () => {
    facade.getDeveloperRelationships.mockResolvedValue([]);
    fixture.detectChanges();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No data to display');
    });

    expect(fixture.debugElement.query(By.directive(ChordDiagramComponent))).toBeNull();
    expect(fixture.debugElement.query(By.directive(TableComponent))).toBeNull();
  });

  it('renders the diagram and developer table, prompting to select an author until one is chosen', async () => {
    fixture.detectChanges();
    await waitForAuthorsLoaded();

    const { chordDiagram, tables } = getSyncedControls();
    expect(chordDiagram.componentInstance.data()).toEqual(relationships);
    expect(tables).toHaveLength(1);
    expect(tables[0].componentInstance.rows()).toEqual(component.authorRows());
    expect(fixture.nativeElement.textContent).toContain('Select an author');

    component.selectedAuthor.set('Ada');
    fixture.detectChanges();

    const { relatedTable } = getSyncedControls();
    expect(component.relatedAuthors()).toEqual(relationships[0].coupledAuthors);
    expect(relatedTable.componentInstance.rows()).toEqual(component.relatedAuthorRows());
  });

  it.each([
    ['chord diagram', () => getSyncedControls().chordDiagram.componentInstance.selectedAuthor],
    ['developer table', () => getSyncedControls().developerTable.componentInstance.selectedRowKey],
    ['related table', () => getSyncedControls().relatedTable.componentInstance.selectedRowKey],
  ])('keeps selectedAuthor in sync when changed from the %s', async (_label, getSourceSignal) => {
    component.selectedAuthor.set('Ada');
    fixture.detectChanges();
    await waitForAuthorsLoaded();

    getSourceSignal().set('Grace');
    fixture.detectChanges();

    const { chordDiagram, developerTable, relatedTable } = getSyncedControls();
    expect(component.selectedAuthor()).toBe('Grace');
    expect(chordDiagram.componentInstance.selectedAuthor()).toBe('Grace');
    expect(developerTable.componentInstance.selectedRowKey()).toBe('Grace');
    expect(relatedTable.componentInstance.selectedRowKey()).toBe('Grace');
  });

  it.each([
    ['chord diagram', () => getSyncedControls().chordDiagram.componentInstance.hoveredAuthor],
    ['developer table', () => getSyncedControls().developerTable.componentInstance.focusedRowKey],
    ['related table', () => getSyncedControls().relatedTable.componentInstance.focusedRowKey],
  ])('keeps hoveredAuthor in sync when changed from the %s', async (_label, getSourceSignal) => {
    component.selectedAuthor.set('Ada');
    fixture.detectChanges();
    await waitForAuthorsLoaded();

    getSourceSignal().set('Grace');
    fixture.detectChanges();

    const { chordDiagram, developerTable, relatedTable } = getSyncedControls();
    expect(component.hoveredAuthor()).toBe('Grace');
    expect(chordDiagram.componentInstance.hoveredAuthor()).toBe('Grace');
    expect(developerTable.componentInstance.focusedRowKey()).toBe('Grace');
    expect(relatedTable.componentInstance.focusedRowKey()).toBe('Grace');
  });
});
