import type { EvidenceRepository } from "@/services/api/types/evidence";
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
    async analyzeEvidence(req) {
      return post("/analyze/evidence", req);
    },
    async uploadFile(file: File, evidenceType: string) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", evidenceType);
      const res = await httpClient.post<any>("/upload/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    async importEvidence(req) {
      return post("/evidence/import", req);
    },
  };
}
