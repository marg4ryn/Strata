import type { Routes } from '@angular/router';

import { AnalysisRunPageComponent } from './features/analysis-run';
import { AboutPageComponent } from './features/about';

export const routes: Routes = [
  {
    path: '',
    component: AnalysisRunPageComponent,
  },
  {
    path: 'about',
    component: AboutPageComponent,
  },
  {
    path: 'analysis/:id',
    loadChildren: () => import('./features/analysis-results').then((m) => m.analysisResultsRoutes),
  },
];
