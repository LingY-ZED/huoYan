export interface EvidenceListItem {
  type: string;
  id: number;
  time: string;
  initiator?: string;
  receiver?: string;
  content: string;
  hit_keywords: string[];
  score: number;
  crime_type: string;
  severity_level?: string;
}

export interface GetEvidenceListResponse {
  evidence_list: EvidenceListItem[];
  communication_evidence_count: number;
  price_anomaly_evidence_count: number;
  logistics_evidence_count: number;
}

export interface LedgerRepository {
  getEvidenceList(caseId: string): Promise<GetEvidenceListResponse>;
}
