import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

const MAX_ITEMS = 50;

@Component({
  selector: 'app-code-age',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-age.component.scss',
  templateUrl: './code-age.component.html',
})
export class CodeAgeComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getCodeAgeDetails(this.id()),
    () => this.id(),
  );

  codeAgeItems = computed(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource
      .value()
      .map((item) => ({
        ...item,
        name: item.path.split(/[\\/]/).pop() ?? item.path,
        colorIntensity: Math.min(Math.max(item.normalizedValue, 0), 1),
      }))
      .sort((a, b) => a.codeAgeDays - b.codeAgeDays)
      .slice(0, MAX_ITEMS);
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: 0x1e90ff,
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
