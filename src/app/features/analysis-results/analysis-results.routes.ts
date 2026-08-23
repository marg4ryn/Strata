import { Routes } from '@angular/router';

export const ANALYSIS_RESULTS_ROUTES: Routes = [
  {
    path: 'summary',
    loadComponent: () =>
      import('./feature/repository-details/repository-details.component').then(
        (m) => m.RepositoryDetailsComponent,
      ),
  },
];
