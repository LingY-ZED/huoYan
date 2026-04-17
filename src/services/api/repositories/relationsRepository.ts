import { get } from "../client";
import type { RelationsRepository, GetCrossCaseRequest, GetUpstreamRequest } from "../types/relations";

export function createApiRelationsRepository(): RelationsRepository {
  return {
    async getCrossCaseGraph(req?: GetCrossCaseRequest) {
      return get("/relations/cross-case", { params: req });
    },
    async getUpstreamGraph(req: GetUpstreamRequest) {
      return get(`/relations/chain/${req.caseId}`);
    },
    async getFundFlows() {
      return get("/ledger/transactions");
    },
    async getPersonLedger() {
      return get("/ledger/persons");
    },
  };
}
