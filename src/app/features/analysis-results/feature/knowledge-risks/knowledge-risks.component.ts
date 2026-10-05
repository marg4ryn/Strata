import { ChangeDetectionStrategy, Component, computed, inject, input, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import type { KnowledgeRisk } from '@app/features/analysis-results/analysis-results.model';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

interface KnowledgeRiskItem {
  name: KnowledgeRisk;
  count: number;
  color: string;
}

const KNOWLEDGE_RISK_KEYS: Record<KnowledgeRisk, string> = {
  ABANDONED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.abandoned'),
  SINGLE_OWNER: marker(
    'analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.singleOwner',
  ),
  BALANCED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.balanced'),
  DIFFUSED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.diffused'),
  UNKNOWN: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.unknown'),
};

const KNOWLEDGE_RISK_COLORS: Record<KnowledgeRisk, number> = {
  BALANCED: 0x2e9e5b,
  SINGLE_OWNER: 0xe8a317,
  DIFFUSED: 0xd0372d,
  ABANDONED: 0x4a4a52,
  UNKNOWN: 0xffffff,
};

@Component({
  selector: 'app-knowledge-risks',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './knowledge-risks.component.scss',
  templateUrl: './knowledge-risks.component.html',
})
export class KnowledgeRisksComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getKnowledgeRisksDetails(this.id()),
    () => this.id(),
  );

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: KNOWLEDGE_RISK_COLORS[item.knowledgeRisk] ?? KNOWLEDGE_RISK_COLORS['UNKNOWN'],
      intensity: 1,
    }));
  });

  knowledgeRiskItems = computed<KnowledgeRiskItem[]>(() => {
    if (!this.resource.hasValue()) return [];

    const counts = new Map<KnowledgeRisk, number>();

    for (const item of this.resource.value()) {
      counts.set(item.knowledgeRisk ?? '-', (counts.get(item.knowledgeRisk ?? '-') ?? 0) + 1);
    }

    return Array.from(counts, ([name, count]) => {
      const color = KNOWLEDGE_RISK_COLORS[name] ?? KNOWLEDGE_RISK_COLORS['UNKNOWN'];

      return {
        name,
        count,
        color: `#${color.toString(16).padStart(6, '0')}`,
      };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, this.activeLang()));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }

  getKnowledgeRiskKey(risk: KnowledgeRisk): string {
    return KNOWLEDGE_RISK_KEYS[risk] ?? KNOWLEDGE_RISK_KEYS['UNKNOWN'];
  }
}
