import type { Routes } from '@angular/router';

import { AnalysisRunPageComponent } from './features/analysis-run';

export const routes: Routes = [
  {
    path: '',
    component: AnalysisRunPageComponent,
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about').then((m) => m.AboutPageComponent),
  },
  {
    path: 'analysis/:id',
    loadChildren: () => import('./features/analysis-results').then((m) => m.analysisResultsRoutes),
  },
];
