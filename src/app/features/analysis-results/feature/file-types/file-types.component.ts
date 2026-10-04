import { ChangeDetectionStrategy, Component, computed, inject, input, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

interface FileTypeItem {
  name: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-file-types',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './file-types.component.scss',
  templateUrl: './file-types.component.html',
})
export class FileTypesComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getFileExtensions(this.id()),
    () => this.id(),
  );

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource.value().map((item) => ({
      path: item.path,
      color: TYPE_COLORS[item.type] ?? FALLBACK_COLOR,
      intensity: 1,
    }));
  });

  fileTypeItems = computed<FileTypeItem[]>(() => {
    if (!this.resource.hasValue()) return [];

    const counts = new Map<string, number>();

    for (const item of this.resource.value()) {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    }

    return Array.from(counts, ([name, count]) => {
      const color = TYPE_COLORS[name] ?? FALLBACK_COLOR;

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
}

const FALLBACK_COLOR = 0x808080;

const TYPE_COLORS: Record<string, number> = {
  // Frontend & Web
  JavaScript: 0xf7df1e,
  TypeScript: 0x3178c6,
  'Vuejs Component': 0x41b883,
  Svelte: 0xff3e00,
  HTML: 0xe34c26,
  CSS: 0x1572b6,
  Sass: 0xcc6699,
  SCSS: 0xcc6699,
  LESS: 0x1d365d,
  JSON: 0x292929,
  XML: 0x0060ac,
  YAML: 0xcb171e,
  Markdown: 0x083fa1,
  GraphQL: 0xe10098,

  // Backend & General Purpose
  Java: 0xb07219,
  Python: 0x3572a5,
  'C#': 0x178600,
  'C++': 0xf34b7d,
  C: 0x555555,
  'C/C++ Header': 0xf34b7d,
  Go: 0x00add8,
  Rust: 0xdea584,
  Ruby: 0x701516,
  PHP: 0x4f5d95,
  Swift: 0xf05138,
  Kotlin: 0xa97bff,
  Dart: 0x00b4ab,
  Scala: 0xc22d40,
  Elixir: 0x6e4a7e,
  Clojure: 0xdb5855,
  Groovy: 0x4298b8,

  // Scripts and Others
  'Bourne Again Shell': 0x89e051,
  'Bourne Shell': 0x89e051,
  'DOS Batch': 0xb1b1b1,
  PowerShell: 0x012456,
  SQL: 0xe38c00,
  Dockerfile: 0x384d54,
  Makefile: 0x427819,
  Assembly: 0x6e4c13,
  Lua: 0x000080,
  Perl: 0x0298c3,
};
