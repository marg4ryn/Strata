import {
  ChangeDetectionStrategy,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  Component,
  input,
  output,
  inject,
  computed,
  viewChild,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { ErrorType, PendingAnalysis } from '../../analysis-run.model';
import { InfoPanelComponent } from '../info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-error-modal',
  imports: [ButtonDirective, InfoPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-error-modal.component.html',
  styleUrl: './analysis-error-modal.component.scss',
})
export class AnalysisErrorModalComponent implements AfterViewInit, OnDestroy {
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
