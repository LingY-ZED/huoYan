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
    async uploadFile(url: string, formData: FormData, config?: any) {
      const res = await httpClient.post<FormData, any>(
        url,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          ...config
        }
      );
      return res.data;
    },
    async importEvidence(req) {
      return post("/evidence/import", req);
    },
  };
}
