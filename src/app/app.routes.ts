import { Routes } from '@angular/router';

import { AnalysisRunPage } from './features/analysis-run/feature/analysis-run-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AnalysisRunPage,
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about-page.component'),
  },
  {
    path: 'analysis/:id',
    loadChildren: () =>
      import('./features/analysis-results/analysis-results.routes').then(
        (m) => m.ANALYSIS_RESULTS_ROUTES,
      ),
  },
];
