import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import { LocalizedDatePipe } from '@app/shared/localized-date-pipe/localized-date.pipe';
import { PendingAnalysis } from '../../analysis-run.model';

@Component({
  selector: 'app-info-panel',
  imports: [TranslocoPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.scss',
})
export class InfoPanelComponent {
  readonly pendingAnalysis = input<PendingAnalysis | null>();
}
