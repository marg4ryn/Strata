import type { Routes } from '@angular/router';

import { AnalysisResultsShellComponent } from './feature/analysis-results-shell/analysis-results-shell.component';
import { RepositoryDetailsComponent } from './feature/views/repository-details/repository-details.component';
import { DeveloperRelationshipsComponent } from './feature/views/developer-relationships/developer-relationships.component';
import { provideAnalysisCharts } from './ui/charts/charts.providers';

export const analysisResultsRoutes: Routes = [
  {
    path: '',
    component: AnalysisResultsShellComponent,
    providers: [provideAnalysisCharts()],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'summary' },
      { path: 'summary', component: RepositoryDetailsComponent },
      { path: 'developer-relationships', component: DeveloperRelationshipsComponent },
      {
        path: 'code-city',
        loadChildren: () => import('./code-city/code-city.routes').then((m) => m.codeCityRoutes),
      },
    ],
  },
];
