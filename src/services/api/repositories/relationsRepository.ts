import { get } from "../client";
import type { RelationsRepository, GetCrossCaseRequest, GetUpstreamRequest } from "../types/relations";

export function createApiRelationsRepository(): RelationsRepository {
  return {
    async getCrossCaseGraph(req?: GetCrossCaseRequest) {
      return get("/relations/cross-case", { params: req });
    },
    async getUpstreamGraph(req: GetUpstreamRequest) {
      return get(`/relations/upstream/${req.caseId}`);
    },
  };
}
