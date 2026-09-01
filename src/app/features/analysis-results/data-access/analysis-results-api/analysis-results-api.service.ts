import { Service, inject } from '@angular/core';

import { HttpService } from '@app/core/http/http.service';
import type {
  RepositoryDetails,
  RepositoryTrends,
  AuthorStatistics,
} from '../../analysis-results.model';

@Service()
export class AnalysisResultsApiService {
  private readonly http = inject(HttpService);

  fetchRepositoryDetails(analysisId: string): Promise<RepositoryDetails> {
    return this.http.get<RepositoryDetails>(`/analysis/${analysisId}/summary`);
  }

  fetchRepositoryTrends(analysisId: string): Promise<RepositoryTrends> {
    return this.http.get<RepositoryTrends>(`/analysis/${analysisId}/trends`);
  }

  fetchAuthorStatistics(analysisId: string): Promise<AuthorStatistics> {
    return this.http.get<AuthorStatistics>(`/analysis/${analysisId}/authors/statistics`);
  }
}
