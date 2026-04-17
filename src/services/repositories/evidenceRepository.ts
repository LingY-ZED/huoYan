import type { EvidenceRepository } from "@/services/api/types/evidence";
import { mockEvidenceAnalysis } from "@/mocks/evidence";

export type { EvidenceRepository };

export function createMockEvidenceRepository(): EvidenceRepository {
  return {
    async analyzeChat(payload) {
      if (!payload.rawText.trim()) {
        return { code: 400, message: "empty_raw_text" };
      }
      return mockEvidenceAnalysis;
    },
    async analyzeTransfer() {
      return {
        code: 0,
        message: "success",
        data: {
          totalAmount: 286500,
          transactionCount: 18,
          personCount: 9,
          topCounterparties: [
            { name: "刘某某", amount: 20200, percent: 100 },
            { name: "曹某某", amount: 15200, percent: 75 },
          ],
          records: [],
        },
      };
    },
    async analyzeLogistics() {
      return {
        code: 0,
        message: "success",
        data: {
          totalShipments: 12,
          expressCount: 8,
          personCount: 5,
          suspiciousShipments: [
            {
              expressNo: "SF1234567890",
              sender: "刘某某",
              receiver: "曹某某",
              time: "2024-03-10 14:32",
              channel: "顺丰速运",
              reason: "收件人地址与案件关联地址一致",
            },
            {
              expressNo: "YT9876543210",
              sender: "经销商A",
              receiver: "买家乙",
              time: "2024-03-12 09:15",
              channel: "圆通速递",
              reason: "高频发件，疑似囤货转寄",
            },
          ],
          records: [],
        },
      };
    },
    async uploadFile(req) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            code: 0,
            message: "success",
            data: {
              rawText: `mock_uploaded_content_for_${req.file.name}`,
              fileName: req.file.name,
              recordCount: 5,
            },
          });
        }, 800);
      });
    },
    async importEvidence() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            code: 0,
            message: "success",
            data: {
              evidenceId: `EV-${Date.now()}`,
              caseId: "2024-京二检-001",
              importedCount: 1,
              message: "证据清单导入成功",
            },
          });
        }, 600);
      });
    },
  };
}
