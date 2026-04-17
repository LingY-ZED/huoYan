export type CaseStatus = "待核查" | "核查中" | "已移送";

export type CaseTag = "价格异常" | "主观明知" | "跨省销售" | "多案关联";

export type CaseFilter = {
  caseId?: string;
  suspect?: string;
  brand?: string;
  status?: CaseStatus | "全部";
  page?: number;
  pageSize?: number;
};

export type TradeRecord = {
  date: string;
  product: string;
  buyer: string;
  amount: number;
};

export type CaseSummary = {
  id: string;
  suspect: string;
  brand: string;
  amount: number;
  unit: "万元";
  clues: number;
  linked: number;
  tags: CaseTag[];
  status: CaseStatus;
  createdAt: string;
  trades: TradeRecord[];
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

