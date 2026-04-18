import type { LedgerRepository } from "../types/ledger";
import { get } from "../client";

export function createApiLedgerRepository(): LedgerRepository {
  return {
    async getEvidenceList(caseId) {
      return get(`/ledger/evidence-inventory/${caseId}`);
    },
  };
}
