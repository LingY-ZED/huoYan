import type { ApiResult, PagedResult } from "@/entities/common";
import type { CaseDetail, CaseSummary } from "@/entities/case";

export const mockCaseList: ApiResult<PagedResult<CaseSummary>> = {
  code: 0,
  message: "success",
  data: {
    total: 4,
    page: 1,
    pageSize: 10,
    list: [
      {
        id: "2024-京二检-001",
        suspect: "曹某某",
        brand: "假冒奥迪轮毂",
        amount: 28.5,
        unit: "万元",
        clues: 18,
        linked: 3,
        tags: ["价格异常", "主观明知", "多案关联"],
        status: "待核查",
        createdAt: "2024-03-10",
        trades: [
          { date: "2024-03-10", product: "奥迪A4L轮毂×50", buyer: "经销商A", amount: 14000 },
          { date: "2024-03-12", product: "奥迪A4L轮毂×30", buyer: "买家乙", amount: 8400 },
          { date: "2024-03-15", product: "宝马5系轮毂×20", buyer: "微信用户", amount: 6000 },
        ],
      },
      {
        id: "2024-京二检-002",
        suspect: "刘某某",
        brand: "假冒博世刹车片",
        amount: 15.2,
        unit: "万元",
        clues: 9,
        linked: 2,
        tags: ["跨省销售", "多案关联"],
        status: "核查中",
        createdAt: "2024-03-08",
        trades: [
          { date: "2024-03-08", product: "博世刹车片×100", buyer: "曹某某", amount: 15200 },
          { date: "2024-03-14", product: "博世火花塞×50", buyer: "经销商B", amount: 5000 },
        ],
      },
      {
        id: "2024-京二检-003",
        suspect: "陈某强",
        brand: "假冒瓦莱奥皮带",
        amount: 9.8,
        unit: "万元",
        clues: 6,
        linked: 1,
        tags: ["价格异常"],
        status: "已移送",
        createdAt: "2024-03-05",
        trades: [{ date: "2024-03-05", product: "瓦莱奥皮带×80", buyer: "经销商C", amount: 9800 }],
      },
      {
        id: "2024-京二检-004",
        suspect: "周某某",
        brand: "假冒米其林轮胎",
        amount: 33.0,
        unit: "万元",
        clues: 14,
        linked: 4,
        tags: ["价格异常", "跨省销售", "主观明知"],
        status: "待核查",
        createdAt: "2024-03-01",
        trades: [{ date: "2024-03-01", product: "米其林轮胎×100", buyer: "多家汽修厂", amount: 33000 }],
      },
    ],
  },
};

const chatExample = [
  "曹某某: 刘哥，刚到一批轮毂。",
  "刘某某: 有奥迪A4L那款吗？",
  "曹某某: 有，280一个。",
  "刘某某: 市面上正品要600多。",
  "刘某某: 这批货你别声张，不是原厂的，老规矩。",
  "曹某某: 行，先来50个。",
  "刘某某: 钱打农行卡，户名刘某某，尾号4589。",
].join("\n");

export const mockCaseDetailById: Record<string, ApiResult<CaseDetail>> = {
  "2024-京二检-001": {
    code: 0,
    message: "success",
    data: {
      ...(mockCaseList.data.list[0] as CaseSummary),
      chatRawText: chatExample,
      chatEvidenceAnchors: [
        { evidenceId: "evidence-001", word: "280", lineHint: "行3" },
        { evidenceId: "evidence-003", word: "不是原厂", lineHint: "行5" },
        { evidenceId: "evidence-004", word: "别声张", lineHint: "行5" },
        { evidenceId: "evidence-005", word: "4589", lineHint: "行7" },
      ],
    },
  },
};

