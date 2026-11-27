import { Injectable, signal } from '@angular/core';
import type { TemplateRef } from '@angular/core';

import type { PathColorData } from '@app/features/analysis-results/code-city/ui/scene/scene.model';

@Injectable()
export class CodeCityStateService {
  template = signal<TemplateRef<unknown> | null>(null);

  colorData = signal<PathColorData[]>([]);

  selectedNodePath = signal<string | null>(null);
  hoveredNodePath = signal<string | null>(null);

  keyboardNavigationActive = signal(false);
}
