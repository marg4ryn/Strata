import { Service, inject } from '@angular/core';

import { HttpService } from '@app/core/http';
import type {
  KnowledgeRisksDetails,
  LeadAuthorsDetails,
  RepositoryDetails,
  RepositoryTrends,
  AuthorStatistics,
  HotspotsDetails,
  CodeAgeDetails,
  AuthorCoupling,
  FileExtension,
  FileDetails,
  CityNode,
  CityItem,
} from '../../analysis-results.model';

@Service()
export class AnalysisResultsApiService {
  private readonly http = inject(HttpService);

  fetchRepositoryDetails(analysisId: string): Promise<RepositoryDetails> {
    return this.http.get<RepositoryDetails>(`/analysis/${analysisId}/summary`);
  }

  fetchRepositoryTrends(analysisId: string): Promise<RepositoryTrends[]> {
    return this.http.get<RepositoryTrends[]>(`/analysis/${analysisId}/trends`);
  }

  fetchAuthorStatistics(analysisId: string): Promise<AuthorStatistics[]> {
    return this.http.get<AuthorStatistics[]>(`/analysis/${analysisId}/authors/statistics`);
  }

  fetchDeveloperRelationships(analysisId: string): Promise<AuthorCoupling[]> {
    return this.http.get<AuthorCoupling[]>(`/analysis/${analysisId}/authors/coupling`);
  }

  fetchCityNode(analysisId: string): Promise<CityNode> {
    return this.http.get<CityNode>(`/analysis/${analysisId}/structure`);
  }

  fetchCityItems(analysisId: string): Promise<CityItem[]> {
    return this.http.get<CityItem[]>(`/analysis/${analysisId}/items`);
  }

  fetchFileExtensions(analysisId: string): Promise<FileExtension[]> {
    return this.http.get<FileExtension[]>(`/analysis/${analysisId}/files/types`);
  }

  fetchFileDetails(analysisId: string, filePath: string): Promise<FileDetails> {
    const queryString = this.buildQueryString({ path: filePath });
    return this.http.get<FileDetails>(`/analysis/${analysisId}/files?${queryString}`);
  }

  fetchHotspotsDetails(analysisId: string): Promise<HotspotsDetails[]> {
    return this.http.get<HotspotsDetails[]>(`/analysis/${analysisId}/files/hotspots`);
  }

  fetchCodeAgeDetails(analysisId: string): Promise<CodeAgeDetails[]> {
    return this.http.get<CodeAgeDetails[]>(`/analysis/${analysisId}/files/code-age`);
  }

  fetchKnowledgeRisksDetails(analysisId: string): Promise<KnowledgeRisksDetails[]> {
    return this.http.get<KnowledgeRisksDetails[]>(
      `/analysis/${analysisId}/files/knowledge-loss-risk`,
    );
  }

  fetchLeadAuthorsDetails(analysisId: string): Promise<LeadAuthorsDetails[]> {
    return this.http.get<LeadAuthorsDetails[]>(`/analysis/${analysisId}/files/lead-authors`);
  }

  private buildQueryString(params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    return searchParams.toString();
  }
}
