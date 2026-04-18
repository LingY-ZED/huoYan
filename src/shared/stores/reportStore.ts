import { defineStore } from "pinia";
import { ref } from "vue";

export const useReportStore = defineStore("report", () => {
  // 缓存每个案件最新的报告信息
  // key: case_id, value: { url: string, name: string }
  const reportCache = ref<Record<string, { url: string; name: string }>>({});

  function setReport(caseId: string | number, url: string, name: string) {
    reportCache.value[caseId.toString()] = { url, name };
  }

  function getReport(caseId: string | number) {
    return reportCache.value[caseId.toString()] || null;
  }

  function clearReport(caseId: string | number) {
    delete reportCache.value[caseId.toString()];
  }

  return {
    reportCache,
    setReport,
    getReport,
    clearReport,
  };
});
