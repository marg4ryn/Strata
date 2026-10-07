import { ChangeDetectionStrategy, Component, computed, inject, input, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

interface LeadAuthorItem {
  name: string;
  count: number;
  color: string;
}

const DEV_COLORS = [
  0x00a8ff, // Light blue
  0x4cd137, // Grass green
  0xfbc531, // Sunny yellow
  0xff4757, // Raspberry red
  0x9c88ff, // Light purple
  0x00d8d6, // Turquoise / Cyan
  0xe84393, // Magenta / Pink
  0xffa502, // Light orange
];

const FALLBACK_COLOR = 0x808080;
const NO_AUTHOR = '-';

const toHex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

@Component({
  selector: 'app-lead-authors',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lead-authors.component.scss',
  templateUrl: './lead-authors.component.html',
})
export class LeadAuthorsComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getLeadAuthorsDetails(this.id()),
    () => this.id(),
  );

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly authorCounts = computed(() => {
    const counts = new Map<string, number>();
    if (!this.resource.hasValue()) return counts;

    for (const item of this.resource.value()) {
      const author = item.leadAuthor ?? NO_AUTHOR;
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }

    return counts;
  });

  private readonly developerColorMap = computed(() => {
    const lang = this.activeLang();

    return new Map(
      Array.from(this.authorCounts())
        .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB, lang))
        .map(([name], i) => [name, DEV_COLORS[i % DEV_COLORS.length]] as const),
    );
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    const colors = this.developerColorMap();

    return this.resource.value().map((item) => ({
      path: item.path,
      color: colors.get(item.leadAuthor ?? NO_AUTHOR) ?? FALLBACK_COLOR,
      intensity: 1,
    }));
  });

  leadAuthorItems = computed<LeadAuthorItem[]>(() => {
    const colors = this.developerColorMap();

    return Array.from(this.authorCounts(), ([name, count]) => ({
      name,
      count,
      color: toHex(colors.get(name) ?? FALLBACK_COLOR),
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, this.activeLang()));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}
