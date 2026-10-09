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

type CodeAgeCategory = 'young' | 'mid' | 'old';

const YOUNG_MAX_DAYS = 90;
const MID_MAX_DAYS = 365;

const CATEGORY_ORDER: readonly CodeAgeCategory[] = ['young', 'mid', 'old'];

const CATEGORY_COLORS: Record<CodeAgeCategory, number> = {
  young: 0x1e90ff,
  mid: 0xbf1b1b,
  old: 0x4a4a52,
};

function getCategory(days: number): CodeAgeCategory {
  if (days <= YOUNG_MAX_DAYS) return 'young';
  if (days <= MID_MAX_DAYS) return 'mid';
  return 'old';
}

function toHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

@Component({
  selector: 'app-code-age',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe, InfoTooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-age.component.scss',
  templateUrl: './code-age.component.html',
})
export class CodeAgeComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  resource = pageResource(
    () => this.facade.getCodeAgeDetails(this.id()),
    () => this.id(),
  );

  codeAgeItems = computed(() => {
    const counts: Record<CodeAgeCategory, number> = { young: 0, mid: 0, old: 0 };

    if (this.resource.hasValue()) {
      for (const item of this.resource.value()) {
        counts[getCategory(item.codeAgeDays)]++;
      }
    }

    return CATEGORY_ORDER.map((category) => ({
      name: category,
      count: counts[category],
      color: toHex(CATEGORY_COLORS[category]),
    }));
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: CATEGORY_COLORS[getCategory(item.codeAgeDays)],
      intensity: 1,
    }));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
