import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { InfoTooltipComponent } from '@app/shared/components';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';
import type { Hotspot } from '../../analysis-results.model';

interface HotspotsItem extends Hotspot {
  name: string;
  colorIntensity: number;
}

const MAX_ITEMS = 30;

@Component({
  selector: 'app-hotspots',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe, InfoTooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './hotspots.component.scss',
  templateUrl: './hotspots.component.html',
})
export class HotspotsComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  resource = pageResource<Hotspot[]>(
    () => this.facade.getHotspots(this.id()),
    () => this.id(),
  );

  hotspotItems = computed<HotspotsItem[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource
      .value()
      .map((item) => ({
        ...item,
        name: item.path.split(/[\\/]/).pop() ?? item.path,
        colorIntensity: Math.min(Math.max(item.normalizedValue, 0), 1),
      }))
      .sort(
        (a, b) =>
          b.normalizedValue - a.normalizedValue || a.path.localeCompare(b.path, this.activeLang()),
      )
      .slice(0, MAX_ITEMS);
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: 0xbf1b1b,
      intensity: Math.min(Math.max(item.normalizedValue, 0), 1),
    }));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
