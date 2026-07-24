import { computed } from '@angular/core';
import {
  AfterViewInit,
  ElementRef,
  OnDestroy,
  Component,
  input,
  output,
  inject,
  viewChild,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ErrorType, PendingAnalysis } from '../../analysis-run.model';
import { InfoPanel } from '../info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-error-modal',
  imports: [ButtonDirective, InfoPanel],
  templateUrl: './analysis-error-modal.component.html',
  styleUrl: './analysis-error-modal.component.scss',
})
export class AnalysisErrorModal implements AfterViewInit, OnDestroy {
  private readonly focusMonitor = inject(FocusMonitor);

  readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  readonly retryButton = viewChild<ElementRef<HTMLButtonElement>>('retryButton');

  readonly pendingAnalysis = input<PendingAnalysis | null>();
  readonly error = input<string | null>();
  readonly errorType = input<ErrorType | null>();

  readonly showRetry = computed(() => this.errorType() === 'connection');

  readonly retry = output<void>();
  readonly cancel = output<void>();

  private get focusTarget(): ElementRef<HTMLButtonElement> | undefined {
    return this.retryButton() ?? this.cancelButton();
  }

  ngAfterViewInit(): void {
    const button = this.focusTarget;
    this.focusMonitor.focusVia(button!, 'program');
  }

  ngOnDestroy(): void {
    const button = this.focusTarget;
    this.focusMonitor.stopMonitoring(button!);
  }

  retryAnalysis(): void {
    this.retry.emit();
  }

  cancelAnalysis(): void {
    this.cancel.emit();
  }
}
