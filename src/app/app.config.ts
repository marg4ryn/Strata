import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { NotificationsFacade } from './features/notifications/notifications.facade';
import { AnalysisHistoryFacade } from './features/analysis-history/analysis-history.facade';
import { AnalysisRunFacade } from './features/analysis-run/analysis-run.facade';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
  ],
};
