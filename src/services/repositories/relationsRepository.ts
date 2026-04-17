import type { RelationsRepository } from "@/services/api/types/relations";
import { mockCrossCaseGraph, mockUpstreamGraphByCaseId } from "@/mocks/graphs";

export type { RelationsRepository };

export function createMockRelationsRepository(): RelationsRepository {
  return {
    async getCrossCaseGraph() {
      return mockCrossCaseGraph;
    },
    async getUpstreamGraph(req) {
      const found = mockUpstreamGraphByCaseId[req.caseId];
      if (found) return { code: 0, message: "success", data: found };
      return { code: 404, message: "graph_not_found" };
    },
  };
}
