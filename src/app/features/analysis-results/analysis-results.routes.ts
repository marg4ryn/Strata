import type { Routes } from '@angular/router';

import { AnalysisResultsShellComponent } from './feature/analysis-results-shell/analysis-results-shell.component';
import { RepositoryDetailsComponent } from './feature/repository-details/repository-details.component';
import { DeveloperRelationshipsComponent } from './feature/developer-relationships/developer-relationships.component';

export const analysisResultsRoutes: Routes = [
  {
    path: '',
    component: AnalysisResultsShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'summary' },
      { path: 'summary', component: RepositoryDetailsComponent },
      { path: 'developer-relationships', component: DeveloperRelationshipsComponent },
      {
        path: 'code-city',
        loadChildren: () =>
          import('./feature/code-city-shell/code-city.routes').then((m) => m.codeCityRoutes),
      },
    ],
  },
];
