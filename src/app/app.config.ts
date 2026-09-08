import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePl from '@angular/common/locales/pl';
import { provideTransloco } from '@ngneat/transloco';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { translocoConfig } from './core/transloco/transloco.config';
import { TranslocoLoaderService } from './core/transloco/transloco-loader.service';
import { LanguageFacade } from './core/language/language.facade';
import { NotificationsFacade } from './features/notifications/notifications.facade';
import { AnalysisHistoryFacade } from './features/analysis-history/analysis-history.facade';
import { AnalysisRunFacade } from './features/analysis-run/analysis-run.facade';
import { CACHE_CONFIG } from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';
import type { CacheConfig } from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';

registerLocaleData(localePl);
registerLocaleData(localeEn);

const cacheConfig = {
  maxCaches: 5,
  registryCacheName: '__cache-registry__',
  registryKey: '/registry',
} satisfies CacheConfig;

function initializeLanguage(): void {
  return inject(LanguageFacade).loadLangPreference();
}

function initializeNotifications(): void {
  return inject(NotificationsFacade).loadNotifications();
}

function initializeAnalysisHistory(): void {
  return inject(AnalysisHistoryFacade).loadAnalysisHistory();
}

function initializeAnalysisRunReconnect(): void {
  return inject(AnalysisRunFacade).tryToReconnect();
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Infrastructure
    provideRouter(routes, withComponentInputBinding()),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),

    // Integrations
    provideCharts(withDefaultRegisterables()),
    provideTransloco({
      config: translocoConfig,
      loader: TranslocoLoaderService,
    }),

    // App initializers
    provideAppInitializer(initializeAnalysisRunReconnect),
    provideAppInitializer(initializeAnalysisHistory),
    provideAppInitializer(initializeNotifications),
    provideAppInitializer(initializeLanguage),

    // Cache configuration
    { provide: CACHE_CONFIG, useValue: cacheConfig },
  ],
};
