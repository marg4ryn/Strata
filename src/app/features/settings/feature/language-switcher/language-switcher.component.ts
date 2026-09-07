import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  output,
  viewChild,
} from '@angular/core';

import { LanguageFacade } from '@app/core/language/language.facade';
import { LangPreference, LANGUAGES, SYSTEM_PREFERENCE } from '@app/core/language/language.model';
import { DropdownComponent, DropdownOption } from '@app/shared/dropdown/dropdown.component';

@Component({
  selector: 'app-language-switcher',
  imports: [DropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
})
export class LanguageSwitcherComponent {
  private readonly facade = inject(LanguageFacade);

  readonly openedChange = output<boolean>();

  private readonly dropdown = viewChild.required(DropdownComponent);
  readonly current = this.facade.langPreference;
  readonly isOpen = signal(false);

  readonly options: DropdownOption<LangPreference>[] = [
    { value: SYSTEM_PREFERENCE, label: '', labelKey: 'settings.language.system' },
    ...LANGUAGES,
  ];

  get currentOption(): DropdownOption<LangPreference> {
    return this.options.find((option) => option.value === this.current()) ?? this.options[0];
  }

  toggle(): void {
    this.dropdown().toggle();
  }

  close(): void {
    this.dropdown().close();
  }

  select(values: readonly LangPreference[]): void {
    const [pref] = values;
    if (pref === undefined || pref === this.current()) {
      this.close();
      return;
    }
    this.facade.setPreference(pref);
    this.close();
  }

  onOpenedChange(open: boolean): void {
    this.isOpen.set(open);
    this.openedChange.emit(open);
  }
}
