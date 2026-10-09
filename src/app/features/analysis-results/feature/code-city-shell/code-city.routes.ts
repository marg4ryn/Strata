import type { Routes } from '@angular/router';

import { CodeCityShellComponent } from './components/code-city-shell.component';
import { FileTypesComponent } from '../file-types/file-types.component';
import { HotspotsComponent } from '../hotspots/hotspots.component';
import { CodeAgeComponent } from '../code-age/code-age.component';
import { ChangeCouplingComponent } from '../change-coupling/change-coupling.component';
import { LeadAuthorsComponent } from '../lead-authors/lead-authors.component';
import { KnowledgeRisksComponent } from '../knowledge-risks/knowledge-risks.component';
import { AbandonedCodeComponent } from '../abandoned-code/abandoned-code.component';

export const codeCityRoutes: Routes = [
  {
    path: '',
    component: CodeCityShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'file-types' },
      { path: 'file-types', component: FileTypesComponent },
      { path: 'hotspots', component: HotspotsComponent },
      { path: 'code-age', component: CodeAgeComponent },
      { path: 'change-coupling', component: ChangeCouplingComponent },
      { path: 'lead-authors', component: LeadAuthorsComponent },
      { path: 'knowledge-risks', component: KnowledgeRisksComponent },
      { path: 'abandoned-code', component: AbandonedCodeComponent },
    ],
  },
];
