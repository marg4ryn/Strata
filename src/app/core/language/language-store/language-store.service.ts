import { Service, signal } from '@angular/core';

import type { LangPreference } from '../language.model';

@Service()
export class LanguageStoreService {
  readonly langPreference = signal<LangPreference>('system');
}
