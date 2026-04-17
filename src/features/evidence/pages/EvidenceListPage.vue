<script setup lang="ts">
import { ref, computed } from "vue";
import { ElButton, ElTable, ElTableColumn, ElInput, ElSelect, ElOption, ElTag, ElMessage, ElMessageBox } from "element-plus";
import { Search, Download, Upload, CircleCheck } from "@element-plus/icons-vue";
import { StatCard, PrimaryButton } from "@/shared/components";

const searchText = ref("");
const filterType = ref("");
const filterStatus = ref("");

interface EvidenceItem {
  id: string;
  caseId: string;
  caseName: string;
  type: "chat" | "transfer" | "logistics";
  typeName: string;
  fileName: string;
  recordCount: number;
  uploadTime: string;
  status: "pending" | "analyzed" | "imported";
  statusName: string;
}

const evidenceList = ref<EvidenceItem[]>([
  { id: "EV-001", caseId: "2024-京二检-001", caseName: "曹某某销售假冒注册商标商品案", type: "chat", typeName: "聊天记录", fileName: "微信聊天记录_曹某某.txt", recordCount: 156, uploadTime: "2024-03-15 14:30", status: "imported", statusName: "已导入" },
  { id: "EV-002", caseId: "2024-京二检-001", caseName: "曹某某销售假冒注册商标商品案", type: "transfer", typeName: "资金流水", fileName: "银行流水_曹某某.csv", recordCount: 89, uploadTime: "2024-03-15 15:20", status: "analyzed", statusName: "已解析" },
  { id: "EV-003", caseId: "2024-京二检-002", caseName: "刘某某生产销售伪劣产品案", type: "chat", typeName: "聊天记录", fileName: "微信聊天_刘某某.txt", recordCount: 234, uploadTime: "2024-03-14 10:15", status: "imported", statusName: "已导入" },
  { id: "EV-004", caseId: "2024-京二检-002", caseName: "刘某某生产销售伪劣产品案", type: "logistics", typeName: "物流记录", fileName: "快递单号汇总.csv", recordCount: 45, uploadTime: "2024-03-14 11:30", status: "pending", statusName: "待解析" },
  { id: "EV-005", caseId: "2024-京二检-003", caseName: "陈某强销售侵权复制品案", type: "transfer", typeName: "资金流水", fileName: "支付宝流水_陈某强.csv", recordCount: 67, uploadTime: "2024-03-13 09:45", status: "analyzed", statusName: "已解析" },
]);

const filteredList = computed(() => {
  return evidenceList.value.filter((item) => {
    const matchSearch = !searchText.value ||
      item.id.includes(searchText.value) ||
      item.caseName.includes(searchText.value) ||
      item.fileName.includes(searchText.value);
    const matchType = !filterType.value || item.type === filterType.value;
    const matchStatus = !filterStatus.value || item.status === filterStatus.value;
    return matchSearch && matchType && matchStatus;
  });
});

const totalCount = computed(() => evidenceList.value.length);
const importedCount = computed(() => evidenceList.value.filter((item) => item.status === "imported").length);
const pendingCount = computed(() => evidenceList.value.filter((item) => item.status === "pending" || item.status === "analyzed").length);

function getStatusTag(status: string) {
  const map: Record<string, "success" | "warning" | "info" | "danger"> = {
    pending: "warning",
    analyzed: "info",
    imported: "success",
  };
  return map[status] || "info";
}

function getTypeTag(type: string) {
  const map: Record<string, "success" | "warning" | "info" | "danger"> = {
    chat: "danger",
    transfer: "warning",
    logistics: "info",
  };
  return map[type] || "info";
}

function viewDetail(row: EvidenceItem) {
  ElMessage.info(`查看证据详情：${row.id}`);
}

async function deleteItem(row: EvidenceItem) {
  try {
    await ElMessageBox.confirm(`确定删除证据 ${row.id}？此操作不可恢复。`, "删除确认", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    evidenceList.value = evidenceList.value.filter((item) => item.id !== row.id);
    ElMessage.success("删除成功");
  } catch {
    // cancelled
  }
}

function exportList() {
  ElMessage.success("证据清单导出中...");
}

function goToUpload() {
  window.location.href = "/evidence";
}

function handleAudit() {
  ElMessage.info("审核功能开发中...");
}

function resetFilter() {
  searchText.value = "";
  filterType.value = "";
  filterStatus.value = "";
}
</script>

<template>
  <div class="space-y-5">
    <div class="app-card p-5">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="card-title !mb-0">📄 证据清单管理</div>
          <span class="text-sm text-gray-500">共 {{ filteredList.length }} 条记录</span>
        </div>
        <div class="flex gap-2">
          <ElButton :icon="CircleCheck" type="danger" @click="handleAudit">
            审核
          </ElButton>
          <PrimaryButton type="primary" :icon="Upload" @click="goToUpload">上传新证据</PrimaryButton>
          <PrimaryButton type="secondary" :icon="Download" @click="exportList">导出清单</PrimaryButton>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
      <StatCard title="证据总数" :value="totalCount" unit="份" icon="📂" color="brand" />
      <StatCard title="已入库" :value="importedCount" unit="份" icon="✅" color="safe" />
      <StatCard title="待审核" :value="pendingCount" unit="份" icon="⏳" color="alert" />
    </div>

    <div class="app-card p-5">
      <div class="flex gap-4 mb-4 items-center">
        <ElInput v-model="searchText" placeholder="搜索证据ID/案件名称/文件名" :prefix-icon="Search" class="!w-[280px]" clearable />
        <ElSelect v-model="filterType" placeholder="证据类型" clearable class="!w-[140px]">
          <ElOption label="聊天记录" value="chat" />
          <ElOption label="资金流水" value="transfer" />
          <ElOption label="物流记录" value="logistics" />
        </ElSelect>
        <ElSelect v-model="filterStatus" placeholder="处理状态" clearable class="!w-[140px]">
          <ElOption label="待解析" value="pending" />
          <ElOption label="已解析" value="analyzed" />
          <ElOption label="已导入" value="imported" />
        </ElSelect>
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <ElTable :data="filteredList" stripe class="w-full">
        <ElTableColumn prop="id" label="证据ID" width="100" />
        <ElTableColumn prop="caseId" label="案件编号" width="150" />
        <ElTableColumn prop="caseName" label="案件名称" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="typeName" label="证据类型" width="100">
          <template #default="{ row }">
            <ElTag :type="getTypeTag(row.type)" size="small">{{ row.typeName }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="recordCount" label="记录数" width="80" align="center" />
        <ElTableColumn prop="uploadTime" label="上传时间" width="150" />
        <ElTableColumn prop="statusName" label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="getStatusTag(row.status)" size="small">{{ row.statusName }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-1">
              <el-button size="small" class="!text-brand" @click="viewDetail(row)">查看</el-button>
              <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>
