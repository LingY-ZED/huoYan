import { defineStore } from "pinia";
import { repositories } from "@/services";
import type { CaseDetail, CaseFilter, CaseSummary } from "@/entities/case";

type CasesState = {
  loading: boolean;
  error: string | null;
  filters: CaseFilter;
  list: CaseSummary[];
  selectedCaseId: string | null;
  selectedCaseDetail: CaseDetail | null;
  detailLoading: boolean;
};

export const useCasesStore = defineStore("cases", {
  state: (): CasesState => ({
    loading: false,
    error: null,
    filters: { status: "全部", brand: "全部", page: 1, pageSize: 10 },
    list: [],
    selectedCaseId: null,
    selectedCaseDetail: null,
    detailLoading: false,
  }),
  actions: {
    async refresh() {
      this.loading = true;
      this.error = null;
      try {
        const res = await repositories.cases.listCases(this.filters);
        if (res.code !== 0) throw new Error(res.message);
        this.list = res.data!.list;
      } catch (e) {
        this.error = e instanceof Error ? e.message : "unknown_error";
      } finally {
        this.loading = false;
      }
    },
    async openDetail(caseId: string) {
      this.selectedCaseId = caseId;
      this.selectedCaseDetail = null;
      this.detailLoading = true;
      try {
        const res = await repositories.cases.getCaseDetail(caseId);
        if (res.code !== 0) throw new Error(res.message);
        this.selectedCaseDetail = res.data!;
      } catch (e) {
        this.error = e instanceof Error ? e.message : "unknown_error";
      } finally {
        this.detailLoading = false;
      }
    },
    closeDetail() {
      this.selectedCaseId = null;
      this.selectedCaseDetail = null;
    },
  },
});

