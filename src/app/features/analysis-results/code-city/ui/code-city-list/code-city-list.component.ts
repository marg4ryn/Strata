import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { InfoTooltipComponent, LocalizedNumberPipe } from '@app/shared/ui';
import { CodeCityStateService } from '../../data-access/code-city-state/code-city-state.service';

export interface CodeCityListItem {
  path: string;
  name: string;
  value: number;
  color: string;
  colorIntensity: number;
}

@Component({
  selector: 'app-code-city-list',
  imports: [InfoTooltipComponent, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-city-list.component.html',
  styleUrl: './code-city-list.component.scss',
})
export class CodeCityListComponent {
  readonly state = inject(CodeCityStateService);

  titleKey = input.required<string>();
  infoKey = input<string>();
  valueIsPercent = input(false);
  items = input.required<readonly CodeCityListItem[]>();
}
