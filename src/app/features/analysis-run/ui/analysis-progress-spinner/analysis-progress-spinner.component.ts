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
import { ConfirmOperationModal } from '@app/shared/confirm-operation-modal/confirm-operation-modal.component';
import { InfoPanel } from '../../shared/info-panel.component';

@Component({
  selector: 'app-analysis-progress-spinner',
  imports: [ButtonDirective, ConfirmOperationModal, InfoPanel],
  templateUrl: './analysis-progress-spinner.component.html',
  styleUrl: './analysis-progress-spinner.component.scss',
})
export class AnalysisProgressSpinner implements AfterViewInit, OnDestroy {
  private readonly focusMonitor = inject(FocusMonitor);

  readonly firstButton = viewChild.required<ElementRef<HTMLButtonElement>>('firstButton');

  readonly pendingAnalysis = input<PendingAnalysis | null>();
  readonly label = input<string>('');

  readonly abort = output<void>();

  showModal: boolean = false;

  ngAfterViewInit(): void {
    this.focusMonitor.focusVia(this.firstButton(), 'program');
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.firstButton());
  }

  onCancel(): void {
    this.showModal = false;
  }

  onConfirm(): void {
    this.showModal = false;
    this.abort.emit();
  }

  abortAnalysis(): void {
    this.showModal = true;
  }
}
