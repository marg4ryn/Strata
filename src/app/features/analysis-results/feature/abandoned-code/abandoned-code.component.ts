import { ChangeDetectionStrategy, Component, computed, inject, input, effect } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

const MAX_ITEMS = 50;
const WHITE = [255, 255, 255];
const GRAY = [0x4a, 0x4a, 0x52];

const toGray = (intensity: number): string => {
  const [r, g, b] = WHITE.map((w, i) => Math.round(w - (w - GRAY[i]) * intensity));
  return `rgb(${r}, ${g}, ${b})`;
};

@Component({
  selector: 'app-knowledge-loss',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './abandoned-code.component.scss',
  templateUrl: './abandoned-code.component.html',
})
export class AbandonedCodeComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getKnowledgeRisksDetails(this.id()),
    () => this.id(),
  );

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: 0x4a4a52,
      intensity: Math.min(Math.max(item.normalizedValue, 0), 1),
    }));
  });

  abandonedCodeItems = computed(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource
      .value()
      .map((item) => {
        const intensity = Math.min(Math.max(item.normalizedValue, 0), 1);

        return {
          ...item,
          name: item.path.split(/[\\/]/).pop() ?? item.path,
          color: toGray(intensity),
        };
      })
      .sort((a, b) => b.normalizedValue - a.normalizedValue)
      .slice(0, MAX_ITEMS);
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
