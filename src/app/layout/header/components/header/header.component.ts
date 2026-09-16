import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ConfirmOperationService } from '@app/shared/confirm-operation/services/confirm-operation.service';
import { AnalysisRunFacade } from '@app/features/analysis-run/analysis-run.facade';
import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { NotificationPanelComponent } from '@app/features/notifications/feature/notification-panel.component';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryPanelComponent } from '@app/features/analysis-history/feature/analysis-history-panel.component';
import { SettingsFacade } from '@app/features/settings/settings.facade';
import { SettingsPanelComponent } from '@app/features/settings/feature/settings-panel/settings-panel.component';
import { PanelCoordinatorService } from '../../services/panel-coordinator.service';
import { PanelTriggerComponent } from '../panel-trigger/panel-trigger.component';

@Component({
  selector: 'app-header',
  providers: [PanelCoordinatorService],
  imports: [
    PanelTriggerComponent,
    NotificationPanelComponent,
    AnalysisHistoryPanelComponent,
    SettingsPanelComponent,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmModal = inject(ConfirmOperationService);
  private readonly analysisRun = inject(AnalysisRunFacade);
  protected readonly notifications = inject(NotificationsFacade);
  protected readonly history = inject(AnalysisHistoryFacade);
  protected readonly settings = inject(SettingsFacade);

  async startNewAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      'confirmations.startNewAnalysis',
      'confirm',
    );
    if (!confirmed) return;
    this.analysisRun.navigateToStartNewAnalysis();
  }
}
