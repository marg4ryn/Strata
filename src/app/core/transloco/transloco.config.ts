import { isDevMode } from '@angular/core';
import type { TranslocoConfig } from '@jsverse/transloco';

import { AVAILABLE_LANGS } from '@app/core/language/language.model';

export const translocoConfig: Partial<TranslocoConfig> = {
  availableLangs: AVAILABLE_LANGS,
  defaultLang: 'en',
  reRenderOnLangChange: true,
  prodMode: !isDevMode(),
};
