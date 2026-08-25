import { TranslocoTestingModule, TranslocoTestingOptions } from '@ngneat/transloco';
import en from '../../../assets/i18n/en.json';
import pl from '../../../assets/i18n/pl.json';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { en, pl },
    translocoConfig: {
      availableLangs: ['en', 'pl'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}
