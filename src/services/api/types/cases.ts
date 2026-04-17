import type { ApiResult, PagedResult } from "@/entities/common";
import type { CaseDetail, CaseFilter, CaseSummary, TradeRecord } from "@/entities/case";

export type { CaseDetail, CaseFilter, CaseSummary, TradeRecord };

export interface ListCasesRequest {
  case_no?: string;
  suspect_name?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCaseRequest {
  case_no: string;
  suspect_name: string;
  brand: string;
  amount: number;
}

export interface UpdateCaseRequest {
  suspect_name: string;
  brand: string;
  amount: number;
}

export type ListCasesResponse = ApiResult<PagedResult<CaseSummary>>;
export type GetCaseDetailResponse = ApiResult<CaseDetail>;
export type CreateCaseResponse = ApiResult<CaseSummary>;
export type UpdateCaseResponse = ApiResult<CaseSummary>;

export interface CasesRepository {
  listCases(req: ListCasesRequest): Promise<ListCasesResponse>;
  getCaseDetail(caseId: string): Promise<GetCaseDetailResponse>;
  createCase(req: CreateCaseRequest): Promise<CreateCaseResponse>;
  updateCase(caseId: string, req: UpdateCaseRequest): Promise<UpdateCaseResponse>;
  deleteCase(caseId: string): Promise<ApiResult<null>>;
  getCaseSuspicious(caseId: string): Promise<any>;
  getClueDetail(clueId: string): Promise<any>;
}
