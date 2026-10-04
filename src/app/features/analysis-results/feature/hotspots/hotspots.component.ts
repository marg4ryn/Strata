import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

const MAX_HOTSPOTS = 50;

@Component({
  selector: 'app-hotspots',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './hotspots.component.scss',
  templateUrl: './hotspots.component.html',
})
export class HotspotsComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getHotspotsDetails(this.id()),
    () => this.id(),
  );

  hotspotItems = computed(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource
      .value()
      .map((item) => ({
        ...item,
        name: item.path.split(/[\\/]/).pop() ?? item.path,
        colorIntensity: Math.min(Math.max(item.normalizedValue, 0), 1),
      }))
      .sort((a, b) => b.normalizedValue - a.normalizedValue)
      .slice(0, MAX_HOTSPOTS);
  });

  colorData = computed<PathColorData[]>(() =>
    this.hotspotItems().map((item) => ({
      path: item.path,
      color: 0xbf1b1b,
      intensity: item.colorIntensity,
    })),
  );

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
