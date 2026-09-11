import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';

@Service()
export class TranslocoLoaderService implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
