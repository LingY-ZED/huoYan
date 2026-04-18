<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElButton, ElTable, ElTableColumn, ElInput, ElSelect, ElOption, ElTag, ElMessage } from "element-plus";
import { Search, Download, Upload } from "@element-plus/icons-vue";
import { repositories } from "@/services";
import { maskName } from "@/utils/masking";
import type { EvidenceListItem } from "@/services/api/types/ledger";

const searchText = ref("");
const selectedCaseNo = ref("");
const filterType = ref("");
const loading = ref(false);
const caseOptions = ref<any[]>([]);

const evidenceList = ref<EvidenceListItem[]>([]);
const stats = ref({
  communication: 0,
  price_anomaly: 0,
  logistics: 0,
});

// 加载案件选项 (参照人物台账)
async function loadCaseOptions() {
  try {
    const response = await repositories.cases.listCases({ limit: 100, offset: 0 });
    const list = Array.isArray(response) ? response : (response as any).data?.list || [];
    caseOptions.value = [
      { label: "全部案件", value: "" },
      ...list.map((c: any) => ({
        label: `${c.case_no} — ${c.suspect_name}`,
        value: c.case_no
      }))
    ];
  } catch (error) {
    console.error("加载案件选项失败:", error);
  }
}

// 加载证据数据
async function loadEvidence() {
  loading.value = true;
  try {
    // 默认使用案件ID 4进行演示
    const caseId = "4";
    const response = await repositories.ledger.getEvidenceList(caseId);
    
    const data = (response as any).data || response;
    evidenceList.value = data.evidence_list || [];
    stats.value = {
      communication: data.communication_evidence_count || 0,
      price_anomaly: data.price_anomaly_evidence_count || 0,
      logistics: data.logistics_evidence_count || 0,
    };
  } catch (error) {
    ElMessage.error("获取证据清单失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  try {
    ElMessage.info("正在生成导出文件...");
    const blob = await repositories.export.exportCsv({
      type: "evidence",
      case_no: selectedCaseNo.value || undefined,
      case_id: selectedCaseNo.value ? undefined : 4
    });
    
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `证据清单_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success("导出成功");
  } catch (error) {
    ElMessage.error("导出失败");
  }
}

const filteredList = computed(() => {
  return evidenceList.value.filter((item) => {
    const matchSearch = !searchText.value ||
      item.content.includes(searchText.value) ||
      (item.initiator || '').includes(searchText.value) ||
      (item.receiver || '').includes(searchText.value);
    const matchType = !filterType.value || item.type === filterType.value;
    return matchSearch && matchType;
  });
});

function resetFilter() {
  searchText.value = "";
  selectedCaseNo.value = "";
  filterType.value = "";
}

onMounted(() => {
  loadCaseOptions();
  loadEvidence();
});
</script>

<template>
  <div class="space-y-6">
    <!-- 顶部统计模块 - 完全参照图中样式 -->
    <div class="grid grid-cols-4 gap-6 mb-6">
      <div class="app-card flex flex-col items-center justify-center p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[#1A3A5C] opacity-80">💬</span>
          <span class="text-xs font-bold text-gray-500">通讯证据总数</span>
        </div>
        <p class="text-4xl font-black text-[#1A3A5C] mb-1">{{ stats.communication }}</p>
        <p class="text-xs text-gray-400">条</p>
      </div>
      <div class="app-card flex flex-col items-center justify-center p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-red-600">⚖️</span>
          <span class="text-xs font-bold text-gray-500">价格异常条数</span>
        </div>
        <p class="text-4xl font-black text-red-600 mb-1">{{ stats.price_anomaly }}</p>
        <p class="text-xs text-gray-400">条</p>
      </div>
      <div class="app-card flex flex-col items-center justify-center p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-orange-500">📦</span>
          <span class="text-xs font-bold text-gray-500">物流异常条数</span>
        </div>
        <p class="text-4xl font-black text-orange-600 mb-1">{{ stats.logistics }}</p>
        <p class="text-xs text-gray-400">条</p>
      </div>
      <div class="app-card flex flex-col items-center justify-center p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-blue-500">📂</span>
          <span class="text-xs font-bold text-gray-500">关联证据总额</span>
        </div>
        <p class="text-4xl font-black text-[#1A3A5C] mb-1">{{ evidenceList.length }}</p>
        <p class="text-xs text-gray-400">条</p>
      </div>
    </div>

    <!-- 下方数据表 - 完全参照图中样式 -->
    <div class="app-card p-8 shadow-md rounded-xl">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-6 bg-[#C0392B] rounded-full"></div>
          <div class="flex items-center gap-2">
            <span class="text-xl">📄</span>
            <h3 class="text-lg font-bold text-[#1A3A5C]">证据清单管理</h3>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD" class="!rounded-md" @click="handleExport">导出 Excel</el-button>
        </div>
      </div>

      <div class="flex gap-4 mb-6 items-center">
        <el-select v-model="selectedCaseNo" placeholder="选择关联案件" class="!w-[200px]" size="default" clearable>
          <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <div class="relative">
          <el-input v-model="searchText" placeholder="搜索证据内容" :prefix-icon="Search" class="!w-[280px]" size="default" clearable />
        </div>
        <el-select v-model="filterType" placeholder="选择证据类型" class="!w-[180px]" size="default" clearable>
          <el-option label="通讯记录" value="通讯记录" />
          <el-option label="价格异常" value="价格异常" />
          <el-option label="物流异常" value="物流异常" />
        </el-select>
        <el-button @click="resetFilter" class="px-6">重置</el-button>
      </div>

      <el-table 
        :data="filteredList" 
        stripe 
        size="default" 
        class="w-full custom-table" 
        v-loading="loading"
        :header-cell-style="{ background: '#F8FAFC', color: '#64748B', fontWeight: '600' }"
      >
        <el-table-column prop="time" label="发现时间" width="140">
          <template #default="scope">
            <span class="text-gray-500 font-medium">{{ scope.row.time.split('T')[0] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="130">
          <template #default="{ row }">
            <span
              class="px-3 py-1 rounded text-xs font-bold"
              :style="{
                background: row.type === '通讯记录' ? '#EEF2FF' : row.type === '价格异常' ? '#FFF1F2' : '#F0FDF4',
                color: row.type === '通讯记录' ? '#4F46E5' : row.type === '价格异常' ? '#E11D48' : '#16A34A',
              }"
            >
              {{ row.type }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="相关人员" min-width="160">
          <template #default="{ row }">
            <div v-if="row.initiator || row.receiver" class="flex flex-col gap-1">
              <span v-if="row.initiator" class="text-sm">发起: <span class="font-bold text-[#1A3A5C]">{{ maskName(row.initiator) }}</span></span>
              <span v-if="row.receiver" class="text-sm">接收: <span class="font-bold text-[#1A3A5C]">{{ maskName(row.receiver) }}</span></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="证据原文" min-width="250" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-[#334155] leading-relaxed">{{ scope.row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关键词" min-width="150">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="k in row.hit_keywords" 
                :key="k" 
                class="px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold rounded border border-[#FECACA]"
              >
                {{ k }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="可信度" width="100" align="center">
          <template #default="{ row }">
            <span class="font-black text-sm text-[#1A3A5C]">{{ row.score }}/10</span>
          </template>
        </el-table-column>
        <el-table-column prop="crime_type" label="涉嫌罪名" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span class="text-gray-600 italic text-sm">{{ scope.row.crime_type }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.custom-table :deep(.el-table__row) {
  height: 60px;
}
.custom-table :deep(.el-table__cell) {
  padding: 12px 0;
}
</style>
