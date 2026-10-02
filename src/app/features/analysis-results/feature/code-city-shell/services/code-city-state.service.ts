import { Injectable, signal } from '@angular/core';
import type { TemplateRef } from '@angular/core';

import type { PathColorData } from '@app/features/analysis-results/ui/code-city/code-city.model';

@Injectable()
export class CodeCityStateService {
  column = signal<TemplateRef<unknown> | null>(null);

  colorData = signal<PathColorData[]>([]);

  selectedNode = signal<string | null>(null);
  hoveredNode = signal<string | null>(null);

  keyboardNavigationActive = signal(false);
}
