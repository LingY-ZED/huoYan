import type { ApiResult } from "@/entities/common";
import type { EvidenceAnalysisResult } from "@/entities/evidence";

export type { EvidenceAnalysisResult };

export interface AnalyzeChatRequest {
  caseId?: string;
  rawText: string;
}

export interface AnalyzeTransferRequest {
  records: Array<{
    payer: string;
    payee: string;
    amount: number;
    time: string;
    channel: string;
    caseId?: string;
  }>;
}

export interface AnalyzeLogisticsRequest {
  records: Array<{
    expressNo: string;
    sender: string;
    receiver: string;
    time: string;
    channel?: string;
    caseId?: string;
  }>;
}

export interface AnalyzeTransferResponse {
  totalAmount: number;
  transactionCount: number;
  personCount: number;
  topCounterparties: Array<{ name: string; amount: number; percent: number }>;
  records: AnalyzeTransferRequest["records"];
}

export interface AnalyzeLogisticsResponse {
  totalShipments: number;
  expressCount: number;
  personCount: number;
  suspiciousShipments: Array<{
    expressNo: string;
    sender: string;
    receiver: string;
    time: string;
    channel: string;
    reason: string;
  }>;
  records: AnalyzeLogisticsRequest["records"];
}

export type AnalyzeChatResponse = ApiResult<EvidenceAnalysisResult>;
export type AnalyzeTransferResponseResult = ApiResult<AnalyzeTransferResponse>;
export type AnalyzeLogisticsResponseResult = ApiResult<AnalyzeLogisticsResponse>;

export interface UploadFileRequest {
  file: File;
  evidenceType: "chat" | "transfer" | "logistics";
}

export interface UploadFileResponse {
  rawText: string;
  fileName: string;
  recordCount: number;
}

export interface ImportEvidenceRequest {
  evidenceType: "chat" | "transfer" | "logistics";
  caseId?: string;
  rawText: string;
  analysisData: AnalyzeChatResponse["data"] | AnalyzeTransferResponse | AnalyzeLogisticsResponse;
}

export interface ImportEvidenceResponse {
  evidenceId: string;
  caseId: string;
  importedCount: number;
  message: string;
}

export type UploadFileResponseResult = ApiResult<UploadFileResponse>;
export type ImportEvidenceResponseResult = ApiResult<ImportEvidenceResponse>;

export interface EvidenceRepository {
  analyzeChat(req: AnalyzeChatRequest): Promise<AnalyzeChatResponse>;
  analyzeTransfer(req: AnalyzeTransferRequest): Promise<AnalyzeTransferResponseResult>;
  analyzeLogistics(req: AnalyzeLogisticsRequest): Promise<AnalyzeLogisticsResponseResult>;
  uploadFile(req: UploadFileRequest): Promise<UploadFileResponseResult>;
  importEvidence(req: ImportEvidenceRequest): Promise<ImportEvidenceResponseResult>;
}
