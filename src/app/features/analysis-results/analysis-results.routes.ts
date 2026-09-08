import { Routes } from '@angular/router';

export const analysisResultsRoutes: Routes = [
  {
    path: 'summary',
    loadComponent: () =>
      import('./feature/repository-details/repository-details.component').then(
        (m) => m.RepositoryDetailsComponent,
      ),
  },
];
