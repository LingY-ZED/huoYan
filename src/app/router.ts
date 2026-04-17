import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/cases" },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/features/dashboard/pages/DashboardPage.vue"),
  },
  {
    path: "/cases",
    name: "cases",
    component: () => import("@/features/cases/pages/CasesPage.vue"),
  },
  {
    path: "/evidence",
    name: "evidence",
    redirect: "/evidence/chat",
    component: () => import("@/features/evidence/pages/EvidencePage.vue"),
    children: [
      {
        path: "chat",
        name: "evidence-chat",
        component: () => import("@/features/evidence/pages/EvidencePage.vue"),
      },
      {
        path: "transfer",
        name: "evidence-transfer",
        component: () => import("@/features/evidence/pages/EvidencePage.vue"),
      },
      {
        path: "logistics",
        name: "evidence-logistics",
        component: () => import("@/features/evidence/pages/EvidencePage.vue"),
      },
    ],
  },
  {
    path: "/evidence-list",
    name: "evidence-list",
    component: () => import("@/features/evidence/pages/EvidenceListPage.vue"),
  },
  {
    path: "/relations",
    name: "relations",
    redirect: "/relations/upstream",
    component: () => import("@/features/relations/pages/RelationsPage.vue"),
    children: [
      {
        path: "upstream",
        name: "relations-upstream",
        component: () => import("@/features/relations/pages/RelationsPage.vue"),
      },
      {
        path: "crosscase",
        name: "relations-crosscase",
        component: () => import("@/features/relations/pages/RelationsPage.vue"),
      },
    ],
  },
  {
    path: "/ledger",
    name: "ledger",
    redirect: "/ledger/person",
    component: () => import("@/features/ledger/pages/LedgerPage.vue"),
    children: [
      {
        path: "person",
        name: "ledger-person",
        component: () => import("@/features/ledger/pages/LedgerPage.vue"),
      },
      {
        path: "fund",
        name: "ledger-fund",
        component: () => import("@/features/ledger/pages/LedgerPage.vue"),
      },
      {
        path: "report",
        name: "ledger-report",
        component: () => import("@/features/ledger/pages/LedgerPage.vue"),
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});
