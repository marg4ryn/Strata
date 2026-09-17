import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging/inject-logger/inject-logger';
import { StorageService } from '@app/core/storage/storage.service';
import type { LangPreference } from '../language.model';

@Service()
export class LanguageStorageService {
  private readonly logger = injectLogger('LanguageStorageService');
  private readonly storage = inject(StorageService);

  private readonly langPreferenceKey = 'langPreference';

  getLangPreference(): LangPreference | null {
    return this.storage.getItem<LangPreference>(localStorage, this.langPreferenceKey);
  }

  saveLangPreference(langPreference: LangPreference): void {
    this.storage.setItem<LangPreference>(localStorage, this.langPreferenceKey, langPreference);
    this.logger.debug('Preference saved', { preference: langPreference });
  }
}
