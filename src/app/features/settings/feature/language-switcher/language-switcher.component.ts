import { OverlayModule } from '@angular/cdk/overlay';
import { CdkListbox } from '@angular/cdk/listbox';
import { CdkListboxModule } from '@angular/cdk/listbox';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  output,
} from '@angular/core';

import { LanguageFacade } from '@app/core/language/language.facade';
import { LangPreference, LANGUAGES, SYSTEM_PREFERENCE } from '@app/core/language/language.model';

interface LangOption {
  value: LangPreference;
  label: string;
  labelKey?: string;
}

@Component({
  selector: 'app-language-switcher',
  imports: [OverlayModule, A11yModule, CdkListbox, CdkListboxModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly facade = inject(LanguageFacade);

  private readonly listbox = viewChild.required(CdkListbox);
  private readonly triggerBtn = viewChild.required('triggerBtn', {
    read: ElementRef<HTMLButtonElement>,
  });

  readonly openedChange = output<boolean>();

  readonly current = this.facade.langPreference;
  readonly isOpen = signal(false);

  readonly options: LangOption[] = [
    { value: SYSTEM_PREFERENCE, label: '', labelKey: 'settings.language.system' },
    ...LANGUAGES,
  ];

  get currentOption(): LangOption | undefined {
    return this.options.find((option) => option.value === this.current());
  }

  onOverlayAttached(): void {
    this.listbox().focus();
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
    this.openedChange.emit(this.isOpen());
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.openedChange.emit(false);
    setTimeout(() => {
      const btn = this.triggerBtn();
      btn?.nativeElement.focus();
    }, 0);
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
