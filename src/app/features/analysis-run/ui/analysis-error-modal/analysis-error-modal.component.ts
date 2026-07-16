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
import { PendingAnalysis } from '../../data-access/analysis-run.model';
import { InfoPanel } from '../../shared/info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-error-modal',
  imports: [ButtonDirective, InfoPanel],
  templateUrl: './analysis-error-modal.component.html',
  styleUrl: './analysis-error-modal.component.scss',
})
export class AnalysisErrorModal implements AfterViewInit, OnDestroy {
  private readonly focusMonitor = inject(FocusMonitor);

  readonly firstButton = viewChild.required<ElementRef<HTMLButtonElement>>('firstButton');

  readonly pendingAnalysis = input<PendingAnalysis | null>();
  readonly error = input<string | null>();

  readonly retry = output<void>();
  readonly cancel = output<void>();

  ngAfterViewInit(): void {
    this.focusMonitor.focusVia(this.firstButton(), 'program');
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.firstButton());
  }

  retryAnalysis(): void {
    this.retry.emit();
  }

  cancelAnalysis(): void {
    this.cancel.emit();
  }
}
