import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  signal,
  effect,
  untracked,
} from '@angular/core';
import type { ResourceRef, TemplateRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';

import { AnalysisErrorComponent } from '../analysis-error/analysis-error.component';
import { AnalysisLoadingComponent } from '../analysis-loading/analysis-loading.component';
import { AnalysisNotFoundComponent } from '../analysis-not-found/analysis-not-found.component';

@Component({
  selector: 'app-resource-page',
  imports: [
    NgTemplateOutlet,
    AnalysisErrorComponent,
    AnalysisLoadingComponent,
    AnalysisNotFoundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.scss',
})
export class ResourcePageComponent<T> {
  data = input.required<ResourceRef<T>>();
  delay = input<number>(200);
  minDisplay = input<number>(300);
  content = contentChild.required<TemplateRef<{ $implicit: T }>>('content');

  showLoading = signal(false);
  private loadingShownAt: number | null = null;

  constructor() {
    effect((onCleanup) => {
      const isLoading = this.data().isLoading();

      if (isLoading) {
        if (!untracked(() => this.showLoading())) {
          const id = setTimeout(() => {
            this.showLoading.set(true);
            this.loadingShownAt = Date.now();
          }, this.delay());
          onCleanup(() => clearTimeout(id));
        }
      } else {
        if (this.showLoading() && this.loadingShownAt !== null) {
          const elapsed = Date.now() - this.loadingShownAt;
          const remaining = Math.max(this.minDisplay() - elapsed, 0);
          const id = setTimeout(() => {
            this.showLoading.set(false);
            this.loadingShownAt = null;
          }, remaining);
          onCleanup(() => clearTimeout(id));
        } else {
          this.showLoading.set(false);
        }
      }
    });
  }

  isNotFound = computed(() => {
    const err = this.data().error();
    return err instanceof HttpErrorResponse && err.status === 404;
  });
}
