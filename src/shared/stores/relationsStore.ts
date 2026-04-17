import { defineStore } from "pinia";
import { repositories } from "@/services";
import type { CrossCaseGraph, RelationGraphNode, UpstreamGraph } from "@/entities/graph";

export type RelationsTab = "upstream" | "crosscase";

type RelationsState = {
  tab: RelationsTab;
  selectedCaseId: string | null;
  cross: CrossCaseGraph | null;
  upstream: UpstreamGraph | null;
  selectedNode: RelationGraphNode | null;
  loading: boolean;
  error: string | null;
};

export const useRelationsStore = defineStore("relations", {
  state: (): RelationsState => ({
    tab: "crosscase",
    selectedCaseId: null,
    cross: null,
    upstream: null,
    selectedNode: null,
    loading: false,
    error: null,
  }),
  actions: {
    setTab(tab: RelationsTab) {
      this.tab = tab;
    },
    setSelectedCase(caseId: string | null) {
      this.selectedCaseId = caseId;
    },
    setSelectedNode(node: RelationGraphNode | null) {
      this.selectedNode = node;
    },
    async loadCross() {
      this.loading = true;
      this.error = null;
      try {
        const res = await repositories.relations.getCrossCaseGraph();
        if (res.code !== 0) throw new Error(res.message);
        this.cross = res.data!;
      } catch (e) {
        this.error = e instanceof Error ? e.message : "unknown_error";
      } finally {
        this.loading = false;
      }
    },
    async loadUpstream(caseId: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await repositories.relations.getUpstreamGraph({ caseId });
        if (res.code !== 0) throw new Error(res.message);
        this.upstream = res.data!;
      } catch (e) {
        this.error = e instanceof Error ? e.message : "unknown_error";
      } finally {
        this.loading = false;
      }
    },
  },
});

