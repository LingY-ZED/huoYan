import { get } from "../client";
import type { CasesRepository, ListCasesRequest, GetCaseDetailResponse, ListCasesResponse } from "../types/cases";

export function createApiCasesRepository(): CasesRepository {
  return {
    async listCases(req: ListCasesRequest): Promise<ListCasesResponse> {
      return get<ListCasesResponse>("/cases", { params: req });
    },
    async getCaseDetail(caseId: string): Promise<GetCaseDetailResponse> {
      return get<GetCaseDetailResponse>(`/cases/${caseId}`);
    },
  };
}
