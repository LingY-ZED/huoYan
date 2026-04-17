import type { EvidenceRepository, UploadFileResponseResult } from "@/services/api/types/evidence";
import { post } from "@/services/api/client";
import { httpClient } from "@/services/api/client";

export function createApiEvidenceRepository(): EvidenceRepository {
  return {
    async analyzeChat(req) {
      return post("/evidence/analyze-chat", req);
    },
    async analyzeTransfer(req) {
      return post("/evidence/analyze-transfer", req);
    },
    async analyzeLogistics(req) {
      return post("/evidence/analyze-logistics", req);
    },
    async uploadFile(req): Promise<UploadFileResponseResult> {
      const formData = new FormData();
      formData.append("file", req.file);
      formData.append("evidenceType", req.evidenceType);
      const res = await httpClient.post<FormData, { code: number; message: string; data: { rawText: string; fileName: string; recordCount: number } }>(
        "/evidence/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data as unknown as UploadFileResponseResult;
    },
    async importEvidence(req) {
      return post("/evidence/import", req);
    },
  };
}
