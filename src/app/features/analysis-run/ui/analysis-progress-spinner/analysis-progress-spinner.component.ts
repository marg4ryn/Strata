import {
  ChangeDetectionStrategy,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  Component,
  input,
  output,
  inject,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@jsverse/transloco';

import { ConfirmOperationService } from '@app/shared/confirm-operation/service/confirm-operation.service';
import { ButtonDirective } from '@app/shared/directives/button.directive';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { PendingAnalysis } from '../../analysis-run.model';
import { InfoPanelComponent } from '../info-panel/info-panel.component';

@Component({
  selector: 'app-analysis-progress-spinner',
  imports: [ButtonDirective, LoadingSpinnerComponent, InfoPanelComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-progress-spinner.component.html',
  styleUrl: './analysis-progress-spinner.component.scss',
})
export class AnalysisProgressSpinnerComponent implements AfterViewInit, OnDestroy {
  private readonly confirmModal = inject(ConfirmOperationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusMonitor = inject(FocusMonitor);

  readonly firstButton = viewChild.required<ElementRef<HTMLButtonElement>>('firstButton');

  readonly pendingAnalysis = input<PendingAnalysis | null>();
  readonly labelKey = input<string>('');
  readonly isAborting = input<boolean>(false);

  readonly abort = output<void>();

  ngAfterViewInit(): void {
    this.focusMonitor.focusVia(this.firstButton(), 'program');
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.firstButton());
  }

  async abortAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(this.destroyRef);
    if (!confirmed) return;
    this.abort.emit();
  }
}
