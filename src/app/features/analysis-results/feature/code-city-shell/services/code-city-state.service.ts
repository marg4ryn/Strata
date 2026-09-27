import { Injectable, signal } from '@angular/core';
import type { TemplateRef } from '@angular/core';

@Injectable()
export class CodeCityStateService {
  leftColumn = signal<TemplateRef<unknown> | null>(null);
  rightColumn = signal<TemplateRef<unknown> | null>(null);

  selectedNode = signal<string | null>(null);
  hoveredNode = signal<string | null>(null);
}
