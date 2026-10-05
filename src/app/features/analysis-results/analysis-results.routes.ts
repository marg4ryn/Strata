import type { Routes } from '@angular/router';

export const analysisResultsRoutes: Routes = [
  {
    path: 'summary',
    loadComponent: () =>
      import('./feature/repository-details/repository-details.component').then(
        (m) => m.RepositoryDetailsComponent,
      ),
  },
  {
    path: 'developer-relationships',
    loadComponent: () =>
      import('./feature/developer-relationships/developer-relationships.component').then(
        (m) => m.DeveloperRelationshipsComponent,
      ),
  },
  {
    path: 'code-city',
    loadComponent: () =>
      import('./feature/code-city-shell/components/code-city-shell.component').then(
        (m) => m.CodeCityShellComponent,
      ),
    children: [
      {
        path: 'file-types',
        loadComponent: () =>
          import('./feature/file-types/file-types.component').then((m) => m.FileTypesComponent),
      },
      {
        path: 'hotspots',
        loadComponent: () =>
          import('./feature/hotspots/hotspots.component').then((m) => m.HotspotsComponent),
      },
      {
        path: 'code-age',
        loadComponent: () =>
          import('./feature/code-age/code-age.component').then((m) => m.CodeAgeComponent),
      },
      {
        path: 'knowledge-risks',
        loadComponent: () =>
          import('./feature/knowledge-risks/knowledge-risks.component').then(
            (m) => m.KnowledgeRisksComponent,
          ),
      },
      {
        path: 'abandoned-code',
        loadComponent: () =>
          import('./feature/abandoned-code/abandoned-code.component').then(
            (m) => m.AbandonedCodeComponent,
          ),
      },
    ],
  },
];
