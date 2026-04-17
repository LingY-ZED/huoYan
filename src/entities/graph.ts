export type GraphRoleType = "suspect" | "supplier" | "buyer" | "broker" | "account" | "logistics";

export type RelationGraphNode = {
  id: string;
  name: string;
  role: string;
  roleType: GraphRoleType;
  count: number;
  amount?: number;
  phone?: string;
  caseId?: string;
  linkedPersons?: string;
  info?: string;
  itemStyle?: { color?: string };
  symbolSize?: number;
  symbol?: string;
};

export type RelationGraphEdge = {
  source: string;
  target: string;
  label?: string | { show?: boolean; formatter?: string; fontSize?: number };
  lineStyle?: {
    type?: "solid" | "dashed" | "dotted";
    color?: string;
    width?: number;
    curveness?: number;
  };
};

export type CrossCaseGraph = {
  nodes: RelationGraphNode[];
  links: RelationGraphEdge[];
};

export type UpstreamGraphSupplier = {
  name: string;
  role: string;
  amount?: string;
  info?: string;
  itemStyle: { color: string };
  symbolSize: number;
};

export type UpstreamGraphBuyer = {
  name: string;
  role: string;
  amount?: string;
  info?: string;
  itemStyle: { color: string };
  symbolSize: number;
};

export type UpstreamGraphMiddle = {
  name: string;
  role: string;
  info?: string;
  itemStyle: { color: string };
  symbolSize: number;
  symbol?: string;
};

export type UpstreamGraphCenter = {
  name: string;
  role: string;
  count: number;
  itemStyle: { color: string };
  symbolSize: number;
};

export type UpstreamGraphLink = {
  source: string;
  target: string;
  label?: { show?: boolean; formatter?: string; fontSize?: number };
  lineStyle?: {
    color: string;
    type?: string;
    width?: number;
    curveness?: number;
  };
};

export type UpstreamGraph = {
  caseId: string;
  center: UpstreamGraphCenter;
  suppliers: UpstreamGraphSupplier[];
  buyers: UpstreamGraphBuyer[];
  middle: UpstreamGraphMiddle[];
  links: UpstreamGraphLink[];
};
