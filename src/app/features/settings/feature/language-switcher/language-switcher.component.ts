import { OverlayModule } from '@angular/cdk/overlay';
import { CdkListbox } from '@angular/cdk/listbox';
import { CdkListboxModule } from '@angular/cdk/listbox';
import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';

import { LanguageFacade } from '@app/core/language/language.facade';
import type { LangPreference } from '@app/core/language/language.model';

interface LangOption {
  value: LangPreference;
  label: string;
}

@Component({
  selector: 'app-language-switcher',
  imports: [OverlayModule, A11yModule, CdkListbox, CdkListboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly facade = inject(LanguageFacade);
  private readonly listbox = viewChild.required(CdkListbox);

  readonly current = this.facade.langPreference;
  readonly isOpen = signal(false);

  readonly options: LangOption[] = [
    { value: 'system', label: 'System default' },
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
  ];

  onOverlayAttached(): void {
    this.listbox().focus();
  }

  get currentLabel(): string {
    return this.options.find((option) => option.value === this.current())?.label ?? '';
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  close(): void {
    this.isOpen.set(false);
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
}
