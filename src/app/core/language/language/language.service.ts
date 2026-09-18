import { Service, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

import { injectLogger } from '@app/core/logging';
import { BrowserLanguageService } from '../browser-language/browser-language.service';
import { LanguageStorageService } from '../language-storage/language-storage.service';
import { LanguageStoreService } from '../language-store/language-store.service';
import { AVAILABLE_LANGS, SYSTEM_PREFERENCE } from '../language.model';
import type { Lang, LangPreference } from '../language.model';

@Service()
export class LanguageService {
  private readonly logger = injectLogger('LanguageService');
  private readonly transloco = inject(TranslocoService);
  private readonly storage = inject(LanguageStorageService);
  private readonly store = inject(LanguageStoreService);
  private readonly browser = inject(BrowserLanguageService);
  private readonly meta = inject(Meta);

  private readonly fallbackLang: Lang = 'en';
  private readonly availablePreferences: LangPreference[] = [...AVAILABLE_LANGS, SYSTEM_PREFERENCE];

  loadLangPreference(): void {
    const stored = this.storage.getLangPreference() ?? SYSTEM_PREFERENCE;
    const validated = this.validate(stored);
    this.logger.debug('Preference loaded', { preference: validated });
    this.store.langPreference.set(validated);
    this.apply(validated);
  }

  setPreference(preference: LangPreference): void {
    const validated = this.validate(preference);
    this.storage.saveLangPreference(validated);
    this.store.langPreference.set(validated);
    this.logger.info('Preference changed', { preference: validated });
    this.apply(validated);
  }

  private validate(preference: LangPreference): LangPreference {
    if (this.availablePreferences.includes(preference)) {
      return preference;
    }
    this.logger.warn('Invalid preference, falling back', {
      received: preference,
      fallback: SYSTEM_PREFERENCE,
    });
    return SYSTEM_PREFERENCE;
  }

  private apply(preference: LangPreference): void {
    const lang =
      preference === SYSTEM_PREFERENCE
        ? this.browser.getLang(AVAILABLE_LANGS, this.fallbackLang)
        : preference;

    this.logger.info('Application language changed', { language: lang });
    document.documentElement.lang = lang;

    this.transloco.load(lang).subscribe(() => {
      this.transloco.setActiveLang(lang);
      this.meta.updateTag({
        name: 'description',
        content: this.transloco.translate('meta.description') ?? '',
      });
    });
  }
}
