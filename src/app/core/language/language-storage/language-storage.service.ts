import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import type { LangPreference } from '../language.model';

@Service()
export class LanguageStorageService {
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  private readonly langPreferenceKey = 'langPreference';

  getLangPreference(): LangPreference | null {
    const langPreference = this.storage.getItem<LangPreference>(
      localStorage,
      this.langPreferenceKey,
    );
    this.logger.debug(
      `Language Storage Service returned langPreference: ${langPreference} from localStorage`,
    );
    return langPreference;
  }

  saveLangPreference(langPreference: LangPreference): void {
    this.storage.setItem<LangPreference>(localStorage, this.langPreferenceKey, langPreference);
    this.logger.info(
      `Language Storage Service saved langPreference: ${langPreference} to localStorage`,
    );
  }
}
