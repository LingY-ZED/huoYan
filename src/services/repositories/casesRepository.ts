import type { CasesRepository } from "@/services/api/types/cases";
import type { ApiResult } from "@/entities/common";
import { mockCaseDetailById, mockCaseList } from "@/mocks/cases";
import type { CaseSummary } from "@/entities/case";
import type { ListCasesRequest } from "@/services/api/types/cases";

export type { CasesRepository };

export function createMockCasesRepository(): CasesRepository {
  return {
    async listCases(req: ListCasesRequest) {
      const q = (req.caseId || "").trim();
      const suspect = (req.suspect || "").trim();
      const status = req.status && req.status !== "全部" ? req.status : undefined;
      const brand = req.brand && req.brand !== "全部" ? req.brand : undefined;

      const list = mockCaseList.data!.list.filter((c: CaseSummary) => {
        if (q && !c.id.includes(q)) return false;
        if (suspect && !c.suspect.includes(suspect)) return false;
        if (status && c.status !== status) return false;
        if (brand && !c.brand.includes(brand)) return false;
        return true;
      });

      const result: ApiResult<{ total: number; page: number; pageSize: number; list: CaseSummary[] }> = {
        code: 0,
        message: "success",
        data: { total: list.length, page: req.page ?? 1, pageSize: req.pageSize ?? 10, list },
      };
      return result;
    },
    async getCaseDetail(caseId: string) {
      const found = mockCaseDetailById[caseId];
      if (found) return found;
      const result: ApiResult<null> = { code: 404, message: "case_not_found" };
      return result;
    },
  };
}
