import type { ApiResult, PagedResult } from "@/entities/common";
import type { CaseDetail, CaseFilter, CaseSummary, TradeRecord } from "@/entities/case";

export type { CaseDetail, CaseFilter, CaseSummary, TradeRecord };

export interface ListCasesRequest {
  caseId?: string;
  suspect?: string;
  brand?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export type ListCasesResponse = ApiResult<PagedResult<CaseSummary>>;
export type GetCaseDetailResponse = ApiResult<CaseDetail>;

export interface CasesRepository {
  listCases(req: ListCasesRequest): Promise<ListCasesResponse>;
  getCaseDetail(caseId: string): Promise<GetCaseDetailResponse>;
}
