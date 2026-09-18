import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  output,
  viewChild,
} from '@angular/core';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { LanguageFacade, LANGUAGES, SYSTEM_PREFERENCE } from '@app/core/language';
import type { LangPreference } from '@app/core/language';
import { DropdownComponent } from '@app/shared/components';
import type { DropdownOption } from '@app/shared/components';

@Component({
  selector: 'app-language-switcher',
  imports: [DropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly facade = inject(LanguageFacade);

  readonly openedChange = output<boolean>();

  private readonly dropdown = viewChild.required<DropdownComponent<string>>('dropdown');
  readonly ariaLabelKey = marker('settings.language.ariaLabel');
  readonly current = this.facade.langPreference;
  readonly isOpen = signal(false);

  readonly options: DropdownOption<LangPreference>[] = [
    { value: SYSTEM_PREFERENCE, labelKey: marker('settings.language.system') },
    ...LANGUAGES,
  ];

  get currentOption(): DropdownOption<LangPreference> {
    return this.options.find((option) => option.value === this.current()) ?? this.options[0];
  }

  close(): void {
    this.dropdown().close();
  }

  select(value: LangPreference): void {
    if (value === this.current()) {
      this.close();
      return;
    }

    this.facade.setPreference(value);
    this.close();
  }

  onOpenedChange(open: boolean): void {
    this.isOpen.set(open);
    this.openedChange.emit(open);
  }
}
