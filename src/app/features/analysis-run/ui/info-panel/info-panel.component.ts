import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedDatePipe } from '@app/shared/pipes/localized-date/localized-date.pipe';
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
