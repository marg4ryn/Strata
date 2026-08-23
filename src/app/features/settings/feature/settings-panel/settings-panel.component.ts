import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { SettingsFacade } from '../../settings.facade';
import { SettingsSectionComponent } from '../../ui/settings-section.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-settings-panel',
  imports: [A11yModule, SettingsSectionComponent, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
})
export class SettingsPanelComponent {
  protected readonly facade = inject(SettingsFacade);

  readonly innerOverlayOpen = signal(false);
}
