import { Service, inject } from '@angular/core';

import { HttpService } from '@app/core/http/http.service';
import type { RepositoryDetails } from '../../analysis-results.model';

@Service()
export class AnalysisResultsApiService {
  private readonly http = inject(HttpService);

  fetchRepositoryDetails(analysisId: string): Promise<RepositoryDetails> {
    return this.http.get<RepositoryDetails>(`/analysis/${analysisId}/summary`);
  }
}
