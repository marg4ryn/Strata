import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import type { LangPreference } from '../language.model';

@Service()
export class LanguageStorageService {
  private readonly logger = inject(LoggerService);
  private readonly storage = inject(StorageService);

  private readonly langPrefKey = 'langPref';

  getLangPref(): LangPreference | null {
    const langPref = this.storage.getItem<LangPreference>(localStorage, this.langPrefKey);
    this.logger.debug(`Language Storage Service returned langPref: ${langPref} from localStorage`);
    return langPref;
  }

  saveLangPref(langPref: LangPreference): void {
    this.storage.setItem<LangPreference>(localStorage, this.langPrefKey, langPref);
    this.logger.info(`Language Storage Service saved langPref: ${langPref} to localStorage`);
  }
}
