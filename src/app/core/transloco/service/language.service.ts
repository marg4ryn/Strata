import { Service, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

import { LoggerService } from '@app/core/logging/logger.service';
import { BrowserLanguageService } from '../browser-language/browser-language.service';
import { LanguageStorageService } from '../language-storage/language-storage.service';
import { LanguageStoreService } from '../language-store/language-store.service';
import type { LangPreference } from '../language.model';

@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly storage = inject(LanguageStorageService);
  private readonly store = inject(LanguageStoreService);
  private readonly browser = inject(BrowserLanguageService);
  private readonly logger = inject(LoggerService);

  private readonly fallbackLang = 'en';
  private readonly availableLangs = ['en', 'pl'];
  private readonly availablePreferences = [...this.availableLangs, 'system'];

  loadLangPreference(): void {
    const stored = this.storage.getLangPreference() ?? 'system';
    const preference = this.validate(stored);
    this.logger.debug(`Language Service loaded preference: ${preference}`);
    this.store.langPreference.set(preference);
    this.apply(preference);
  }

  setPreference(preference: LangPreference): void {
    const validated = this.validate(preference);
    this.storage.saveLangPreference(validated);
    this.store.langPreference.set(validated);
    this.logger.info(`Language Service set preference to ${validated}`);
    this.apply(validated);
  }

  private validate(preference: LangPreference): LangPreference {
    if (this.availablePreferences.includes(preference)) {
      return preference;
    }
    this.logger.warn(
      `Language Service received invalid preference "${preference}", falling back to "system"`,
    );
    return 'system';
  }

  private apply(preference: LangPreference): void {
    const lang =
      preference === 'system'
        ? this.browser.getLang(this.availableLangs, this.fallbackLang)
        : preference;

    this.logger.info(`Language Service set application language to ${lang}`);
    this.transloco.setActiveLang(lang);
  }
}
