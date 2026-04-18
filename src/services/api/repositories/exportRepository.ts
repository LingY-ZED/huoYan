import { httpClient } from "../client";

export interface ExportParams {
  type: "transactions" | "persons" | "evidence";
  case_id?: number;
  case_no?: string;
}

export function createApiExportRepository() {
  return {
    async exportCsv(params: ExportParams) {
      const response = await httpClient.get("/export/csv", {
        params,
        responseType: "blob", // 重要：处理文件流
      });
      return response.data;
    },
  };
}
