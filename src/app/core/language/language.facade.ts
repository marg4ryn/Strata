import { Service, inject, computed } from '@angular/core';

import { LanguageService } from './language/language.service';
import { LanguageStoreService } from './language-store/language-store.service';
import type { LangPreference } from './language.model';

@Service()
export class LanguageFacade {
  private readonly store = inject(LanguageStoreService);
  private readonly service = inject(LanguageService);

  readonly langPreference = computed(() => this.store.langPreference());

  loadLangPreference(): void {
    this.service.loadLangPreference();
  }

  setPreference(pref: LangPreference): void {
    this.service.setPreference(pref);
  }
}
