import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
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
  content = contentChild.required<TemplateRef<{ $implicit: T }>>('content');

  isNotFound = computed(() => {
    const err = this.data().error();
    return err instanceof HttpErrorResponse && err.status === 404;
  });
}
