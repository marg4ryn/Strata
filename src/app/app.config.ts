import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@ngneat/transloco';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { translocoConfig } from './core/transloco/transloco.config';
import { TranslocoLoaderService } from './core/transloco/transloco-loader.service';
import { LanguageFacade } from './core/language/language.facade';
import { NotificationsFacade } from './features/notifications/notifications.facade';
import { AnalysisHistoryFacade } from './features/analysis-history/analysis-history.facade';
import { AnalysisRunFacade } from './features/analysis-run/analysis-run.facade';
import {
  CACHE_CONFIG,
  CacheConfig,
} from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    provideTransloco({
      config: translocoConfig,
      loader: TranslocoLoaderService,
    }),
    provideCharts(withDefaultRegisterables()),
    provideAppInitializer(() => {
      const language = inject(LanguageFacade);
      return language.loadLangPreference();
    }),
    provideAppInitializer(() => {
      const notifications = inject(NotificationsFacade);
      return notifications.loadNotifications();
    }),
    provideAppInitializer(() => {
      const history = inject(AnalysisHistoryFacade);
      return history.loadAnalysisHistory();
    }),
    provideAppInitializer(() => {
      const analysisRun = inject(AnalysisRunFacade);
      return analysisRun.tryToReconnect();
    }),
    {
      provide: CACHE_CONFIG,
      useValue: {
        maxCaches: 5,
        registryCacheName: '__cache-registry__',
        registryKey: '/registry',
      } as CacheConfig,
    },
  ],
};
