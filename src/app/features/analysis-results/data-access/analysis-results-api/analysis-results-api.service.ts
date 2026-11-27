import { Service, inject } from '@angular/core';

import { HttpService } from '@app/core/http';
import type { AuthorCoupling } from '../../models/author-coupling.model';
import type { AuthorStatistics } from '../../models/author-statistics.model';
import type { ChangeCoupling } from '../../models/change-coupling.model';
import type { CodeAgeDetails } from '../../models/code-age.model';
import type { CityNode, CityItem } from '../../models/code-city.model';
import type { FileDetails } from '../../models/file-details.model';
import type { FileExtension } from '../../models/file-extensions.model';
import type { Hotspot } from '../../models/hotspots.model';
import type { KnowledgeRisksDetails } from '../../models/knowledge-risks.model';
import type { LeadAuthorsDetails } from '../../models/lead-authors.model';
import type { RepositoryDetails, RepositoryTrends } from '../../models/repository-summary.model';

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

  fetchHotspots(analysisId: string): Promise<Hotspot[]> {
    return this.http.get<Hotspot[]>(`/analysis/${analysisId}/files/hotspots`);
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

  fetchChangeCoupling(analysisId: string): Promise<ChangeCoupling[]> {
    return this.http.get<ChangeCoupling[]>(`/analysis/${analysisId}/files/coupling`);
  }

  private buildQueryString(params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    return searchParams.toString();
  }
}
