import {
  ChangeDetectionStrategy,
  Component,
  viewChild,
  computed,
  inject,
  input,
} from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import { MetaBarComponent } from '../../ui/meta-bar/meta-bar.component';
import type { DateRange } from '../../ui/meta-bar/meta-bar.component';
import { NavbarComponent } from '../../ui/navbar/navbar.component';
import type { NavLinkGroup } from '../../ui/navbar/navbar.component';

@Component({
  selector: 'app-analysis-results-shell',
  imports: [MetaBarComponent, RouterOutlet, NavbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './analysis-results-shell.component.scss',
  templateUrl: './analysis-results-shell.component.html',
})
export class AnalysisResultsShellComponent {
  private readonly facade = inject(AnalysisResultsFacade);

  id = input.required<string>();

  private readonly repositoryIcon = viewChild.required<TemplateRef<void>>('repositoryIcon');
  private readonly codeHealthIcon = viewChild.required<TemplateRef<void>>('codeHealthIcon');
  private readonly developersIcon = viewChild.required<TemplateRef<void>>('developersIcon');

  resource = pageResource(
    () => this.facade.getRepositorySummary(this.id()),
    () => this.id(),
  );

  repoName = computed(() => {
    if (!this.resource.hasValue()) return '';
    const info = this.resource.value()?.details?.info;
    if (!info) return '';
    return `${info.repositoryOwner}/${info.repositoryName}`;
  });

  dateRange = computed<DateRange | null>(() => {
    if (!this.resource.hasValue()) return null;
    const info = this.resource.value()?.details?.info;
    if (!info) return null;
    return {
      startDate: info.analysisRangeStartDate,
      endDate: info.analysisRangeEndDate,
    };
  });

  navbarGroups = computed<NavLinkGroup[]>(() => [
    {
      labelKey: marker('analysisResults.navbar.repository'),
      icon: this.repositoryIcon(),
      links: [
        {
          labelKey: marker('analysisResults.navbar.summary'),
          path: 'summary',
        },
        {
          labelKey: marker('analysisResults.navbar.fileTypes'),
          path: 'code-city/file-types',
        },
      ],
    },
    {
      labelKey: marker('analysisResults.navbar.codeHealth'),
      icon: this.codeHealthIcon(),
      links: [
        {
          labelKey: marker('analysisResults.navbar.hotspots'),
          path: 'code-city/hotspots',
        },
        {
          labelKey: marker('analysisResults.navbar.codeAge'),
          path: 'code-city/code-age',
        },
        {
          labelKey: marker('analysisResults.navbar.changeCoupling'),
          path: 'code-city/change-coupling',
        },
      ],
    },
    {
      labelKey: marker('analysisResults.navbar.developers'),
      icon: this.developersIcon(),
      links: [
        {
          labelKey: marker('analysisResults.navbar.developerRelationships'),
          path: 'developer-relationships',
        },
        {
          labelKey: marker('analysisResults.navbar.codeOwners'),
          path: 'code-city/lead-authors',
        },
        {
          labelKey: marker('analysisResults.navbar.ownershipRisks'),
          path: 'code-city/knowledge-risks',
        },
        {
          labelKey: marker('analysisResults.navbar.abandonedCode'),
          path: 'code-city/abandoned-code',
        },
      ],
    },
  ]);
}
