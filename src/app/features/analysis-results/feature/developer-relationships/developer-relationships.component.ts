import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { TableComponent } from '@app/shared/components';
import type { TableColumn, TableRows } from '@app/shared/components';
import { pageResource } from '../../utils/page-resource/page-resource';
import { ResourcePageComponent } from '../../ui/resource/resource-page/resource-page.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { ChordDiagramComponent } from '../../ui/charts/chord-diagram/chord-diagram.component';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-developer-relationships',
  imports: [
    ResourcePageComponent,
    ChordDiagramComponent,
    TranslocoPipe,
    TableComponent,
    OverlayModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './developer-relationships.component.scss',
  templateUrl: './developer-relationships.component.html',
})
export class DeveloperRelationshipsComponent {
  private readonly facade = inject(AnalysisResultsFacade);

  id = input.required<string>();

  hoveredAuthor = signal<string | null>(null);
  selectedAuthor = signal<string | null>(null);

  readonly developerColumns: TableColumn[] = [
    {
      headerKey: marker('analysisResults.developerRelationships.table.name.label'),
      valueType: 'text',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.coupledAuthors.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.coupledAuthors.tooltip'),
      valueType: 'number',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.totalChanges.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.totalChanges.tooltip'),
      valueType: 'number',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.filesChanged.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.filesChanged.tooltip'),
      valueType: 'number',
    },
  ];

  readonly relatedDeveloperColumns: TableColumn[] = [
    {
      headerKey: marker('analysisResults.developerRelationships.table.name.label'),
      valueType: 'text',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.percentage.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.percentage.tooltip'),
      valueType: 'percent',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.sharedChanges.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.sharedChanges.tooltip'),
      valueType: 'number',
    },
    {
      headerKey: marker('analysisResults.developerRelationships.table.sharedFilesChanged.label'),
      tooltipKey: marker('analysisResults.developerRelationships.table.sharedFilesChanged.tooltip'),
      valueType: 'number',
    },
  ];

  resource = pageResource(
    () => this.facade.getDeveloperRelationships(this.id()),
    () => this.id(),
  );

  authors = computed(() => this.resource.value() ?? []);

  authorRows = computed<TableRows[]>(() =>
    this.authors().map((author) => [
      { value: author.name, valueType: 'text' },
      { value: author.coupledAuthors.length, valueType: 'number' },
      { value: author.totalChanges, valueType: 'number' },
      { value: author.filesChanged, valueType: 'number' },
    ]),
  );

  relatedAuthors = computed(() => {
    const author = this.authors().find((item) => item.name === this.selectedAuthor());
    return author?.coupledAuthors ?? [];
  });

  relatedAuthorRows = computed<TableRows[]>(() =>
    this.relatedAuthors().map((author) => [
      { value: author.name, valueType: 'text' },
      { value: author.percentage, valueType: 'percent' },
      { value: author.sharedChanges, valueType: 'number' },
      { value: author.sharedFilesChanged, valueType: 'number' },
    ]),
  );
}
