import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import {
  AnalysisHistoryFacade,
  AnalysisHistoryPanelComponent,
} from '@app/features/analysis-history';
import { NotificationsFacade, NotificationPanelComponent } from '@app/features/notifications';
import { SettingsFacade, SettingsPanelComponent } from '@app/features/settings';
import { AnalysisRunFacade } from '@app/features/analysis-run';
import { ConfirmOperationService } from '@app/shared/confirm-operation';
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
      marker('confirmations.startNewAnalysis'),
      'confirm',
    );
    if (!confirmed) return;
    this.analysisRun.navigateToStartNewAnalysis();
  }
}
