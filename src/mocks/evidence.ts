import type { ApiResult } from "@/entities/common";
import type { EvidenceAnalysisResult } from "@/entities/evidence";

export const mockEvidenceAnalysis: ApiResult<EvidenceAnalysisResult> = {
  code: 0,
  message: "success",
  data: {
    evidenceCount: 3,
    conclusions: [
      {
        id: "conclusion-001",
        type: "price_anomaly",
        severity: "high",
        title: "价格异常判定",
        evidence: {
          quotedPrice: 280,
          unit: "元/个",
          referencePrice: 600,
          product: "奥迪A4L轮毂",
          discountPercent: 53,
          rawText: "奥迪A4L那款轮毂280一个，市面上正品要600多。",
          evidenceIds: ["evidence-001", "evidence-002"],
        },
      },
      {
        id: "conclusion-002",
        type: "subjective_knowledge",
        severity: "high",
        title: "主观明知证据",
        evidence: {
          rawQuote: "这批货你别声张，不是原厂的，老规矩。",
          speaker: "刘某某",
          keywords: ["别声张", "不是原厂", "老规矩"],
          keywordPositions: [
            { word: "不是原厂", evidenceId: "evidence-003" },
            { word: "别声张", evidenceId: "evidence-004" },
          ],
        },
      },
      {
        id: "conclusion-003",
        type: "key_entity",
        severity: "medium",
        title: "关键主体提取",
        evidence: {
          entities: [
            { name: "曹某某", role: "核心销售商", phone: "138****5678" },
            { name: "刘某某", role: "浙江上游供货", bankAccount: "农行***4589" },
          ],
        },
      },
    ],
  },
};

