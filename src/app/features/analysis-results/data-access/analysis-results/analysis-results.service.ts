import { HttpErrorResponse } from '@angular/common/http';
import { Service } from '@angular/core';

@Service()
export class AnalysisResultsService {
  async getRepositoryDetails(analysisId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // setTimeout(() => resolve(`data for analysis: ${analysisId}`), 5000);
      setTimeout(() => reject(new HttpErrorResponse({ status: 404 })), 5000);
    });
  }
}
