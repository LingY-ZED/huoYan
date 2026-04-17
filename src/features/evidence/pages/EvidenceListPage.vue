<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElButton, ElTable, ElTableColumn, ElInput, ElSelect, ElOption, ElTag, ElMessage, ElMessageBox } from "element-plus";
import { Search, Download, Upload, CircleCheck } from "@element-plus/icons-vue";
import { StatCard, PrimaryButton } from "@/shared/components";
import { repositories } from "@/services";

const searchText = ref("");
const filterType = ref("");
const filterStatus = ref("");

// 加载状态
const loading = ref(false);

// 线索数据类型（与后端保持一致）
interface ClueItem {
  id: number;
  case_id: number;
  clue_type: string;
  evidence_text: string;
  hit_keywords: string;
  score: number;
  crime_type: string;
  severity_level: string;
}

const clueList = ref<ClueItem[]>([]);

// 加载线索数据
async function loadClues() {
  loading.value = true;
  try {
    // 这里暂时使用一个示例案件ID，实际应该从路由参数或用户选择中获取
    const caseId = "1";
    const response = await repositories.cases.getCaseSuspicious(caseId);
    
    if (Array.isArray(response)) {
      clueList.value = response;
    } else if (response.code === 0) {
      clueList.value = response.data || [];
    }
  } catch (error) {
    ElMessage.error("获取线索列表失败，请稍后重试");
    console.error("获取线索列表失败:", error);
  } finally {
    loading.value = false;
  }
}

// 查看线索详情
async function viewClueDetail(clueId: number) {
  try {
    const response = await repositories.cases.getClueDetail(clueId.toString());
    if (response.code === 0) {
      // 这里可以显示线索详情弹窗
      console.log("线索详情:", response.data);
      ElMessage.info(`查看线索详情：${clueId}`);
    } else if (response) {
      console.log("线索详情:", response);
      ElMessage.info(`查看线索详情：${clueId}`);
    }
  } catch (error) {
    ElMessage.error("获取线索详情失败，请稍后重试");
    console.error("获取线索详情失败:", error);
  }
}

const filteredList = computed(() => {
  return clueList.value.filter((item) => {
    const matchSearch = !searchText.value ||
      item.id.toString().includes(searchText.value) ||
      item.evidence_text.includes(searchText.value) ||
      item.hit_keywords.includes(searchText.value);
    const matchType = !filterType.value || item.clue_type === filterType.value;
    const matchStatus = !filterStatus.value || item.severity_level === filterStatus.value;
    return matchSearch && matchType && matchStatus;
  });
});

const totalCount = computed(() => clueList.value.length);
const severeCount = computed(() => clueList.value.filter((item) => item.severity_level === "刑事犯罪").length);
const mediumCount = computed(() => clueList.value.filter((item) => item.severity_level === "民事侵权").length);

function getSeverityTag(severity: string) {
  const map: Record<string, "success" | "warning" | "info" | "danger"> = {
    "刑事犯罪": "danger",
    "民事侵权": "warning",
    "行政违法": "info",
  };
  return map[severity] || "info";
}

function getClueTypeTag(type: string) {
  const map: Record<string, "success" | "warning" | "info" | "danger"> = {
    "主观明知": "danger",
    "价格异常": "warning",
    "角色异常": "info",
  };
  return map[type] || "info";
}

function exportList() {
  ElMessage.success("线索清单导出中...");
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

// 组件挂载时加载数据
onMounted(() => {
  loadClues();
});
</script>

<template>
  <div class="space-y-5">
    <div class="app-card p-5">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="card-title !mb-0">📄 线索清单管理</div>
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
      <StatCard title="线索总数" :value="totalCount" unit="条" icon="📂" color="brand" />
      <StatCard title="刑事犯罪" :value="severeCount" unit="条" icon="⚡" color="danger" />
      <StatCard title="民事侵权" :value="mediumCount" unit="条" icon="⚠️" color="warning" />
    </div>

    <div class="app-card p-5">
      <div class="flex gap-4 mb-4 items-center">
        <ElInput v-model="searchText" placeholder="搜索线索ID/证据原文/命中关键词" :prefix-icon="Search" class="!w-[280px]" clearable />
        <ElSelect v-model="filterType" placeholder="线索类型" clearable class="!w-[140px]">
          <ElOption label="主观明知" value="主观明知" />
          <ElOption label="价格异常" value="价格异常" />
          <ElOption label="角色异常" value="角色异常" />
        </ElSelect>
        <ElSelect v-model="filterStatus" placeholder="严重程度" clearable class="!w-[140px]">
          <ElOption label="刑事犯罪" value="刑事犯罪" />
          <ElOption label="民事侵权" value="民事侵权" />
          <ElOption label="行政违法" value="行政违法" />
        </ElSelect>
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <ElTable :data="filteredList" stripe class="w-full" v-loading="loading">
        <ElTableColumn prop="id" label="线索ID" width="100" />
        <ElTableColumn prop="case_id" label="案件ID" width="100" />
        <ElTableColumn prop="clue_type" label="线索类型" width="120">
          <template #default="{ row }">
            <ElTag :type="getClueTypeTag(row.clue_type)" size="small">{{ row.clue_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="evidence_text" label="证据原文" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="hit_keywords" label="命中关键词" min-width="120" show-overflow-tooltip />
        <ElTableColumn prop="score" label="评分" width="80" align="center">
          <template #default="{ row }">
            <span class="font-semibold">{{ row.score }}/10</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="crime_type" label="涉嫌罪名" min-width="150" show-overflow-tooltip />
        <ElTableColumn prop="severity_level" label="严重程度" width="120">
          <template #default="{ row }">
            <ElTag :type="getSeverityTag(row.severity_level)" size="small">{{ row.severity_level }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-1">
              <el-button size="small" class="!text-brand" @click="viewClueDetail(row.id)">查看</el-button>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>
