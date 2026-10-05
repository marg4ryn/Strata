import type { KnowledgeRisk } from './file-details.model';

export interface KnowledgeRisksDetails {
  path: string;
  knowledgeRisk: KnowledgeRisk;
  knowledgeLoss: number;
  normalizedValue: number;
}
