export type CaseStatus = "待核查" | "核查中" | "已移送";

export type CaseTag = "价格异常" | "主观明知" | "跨省销售" | "多案关联";

export type CaseFilter = {
  case_no?: string;
  suspect_name?: string;
  brand?: string;
  limit?: number;
  offset?: number;
};

export type TradeRecord = {
  date: string;
  product: string;
  buyer: string;
  amount: number;
};

export type CaseSummary = {
  id: number;
  case_no: string;
  suspect_name: string;
  brand: string;
  amount: number;
  created_at: string;
  trades?: TradeRecord[];
};

export type EvidenceAnchor = {
  evidenceId: string;
  word?: string;
  lineHint?: string;
};

export type CaseDetail = CaseSummary & {
  chatRawText: string;
  chatEvidenceAnchors: EvidenceAnchor[];
};