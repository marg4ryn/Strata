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
const PERCENT_OF_HOTSPOTS = 0.15;
const MIN_INTENSITY = 0.1;
const HOTSPOTS_COLOR = 0xbf1b1b;

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

  private readonly topHotspots = computed<Hotspot[]>(() => {
    if (!this.resource.hasValue()) return [];

    const all = this.resource.value();
    if (all.length === 0) return [];

    const count = Math.min(Math.max(Math.ceil(all.length * PERCENT_OF_HOTSPOTS), 1), MAX_ITEMS);

    return [...all]
      .sort(
        (a, b) =>
          b.normalizedValue - a.normalizedValue || a.path.localeCompare(b.path, this.activeLang()),
      )
      .slice(0, count);
  });

  private readonly intensityByPath = computed(() => {
    const top = this.topHotspots();
    const map = new Map<string, number>();
    if (top.length === 0) return map;

    const max = top[0].normalizedValue;
    const min = top[top.length - 1].normalizedValue;
    const range = max - min;

    for (const item of top) {
      const t = range === 0 ? 1 : (item.normalizedValue - min) / range;
      map.set(item.path, MIN_INTENSITY + t * (1 - MIN_INTENSITY));
    }
    return map;
  });

  hotspotItems = computed<HotspotsItem[]>(() => {
    const intensities = this.intensityByPath();

    return this.topHotspots().map((item) => ({
      ...item,
      name: item.path.split(/[\\/]/).pop() ?? item.path,
      colorIntensity: intensities.get(item.path) ?? 0,
    }));
  });

  colorData = computed<PathColorData[]>(() => {
    const intensities = this.intensityByPath();

    return this.topHotspots().map((item) => ({
      path: item.path,
      color: HOTSPOTS_COLOR,
      intensity: intensities.get(item.path) ?? 0,
    }));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
