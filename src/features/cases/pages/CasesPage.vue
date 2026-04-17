<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElMessage,
} from "element-plus";
import { Document, Plus, Edit, Delete } from "@element-plus/icons-vue";
import { mockCaseList, mockCaseDetailById } from "@/mocks/cases";
import type { CaseSummary } from "@/entities/case";
import { PrimaryButton, StatusBadge, TabButton } from "@/shared/components";

const router = useRouter();
const dialogOpen = ref(false);
const detailTab = ref("chat");
const currentCase = ref<CaseSummary | null>(null);
const caseFilter = ref({ id: "", name: "", brand: "", status: "" });

const cases = computed(() => {
  const list = mockCaseList.data!.list.filter((c) => {
    if (caseFilter.value.id && !c.id.includes(caseFilter.value.id)) return false;
    if (caseFilter.value.name && !c.suspect.includes(caseFilter.value.name)) return false;
    if (caseFilter.value.brand && !c.brand.includes(caseFilter.value.brand)) return false;
    if (caseFilter.value.status && c.status !== caseFilter.value.status) return false;
    return true;
  });
  return list;
});

const detailData = computed(() => {
  if (!currentCase.value) return null;
  const found = mockCaseDetailById[currentCase.value.id];
  return found?.data ?? null;
});

function openDetail(row: CaseSummary) {
  currentCase.value = row;
  detailTab.value = "chat";
  dialogOpen.value = true;
}

function resetFilter() {
  caseFilter.value = { id: "", name: "", brand: "", status: "" };
}

const brandOptions = [
  { label: "全部", value: "" },
  { label: "假冒奥迪轮毂", value: "奥迪" },
  { label: "假冒博世刹车片", value: "博世" },
  { label: "假冒米其林轮胎", value: "米其林" },
  { label: "假冒瓦莱奥皮带", value: "瓦莱奥" },
];

const statusOptions = [
  { label: "全部", value: "" },
  { label: "待核查", value: "待核查" },
  { label: "核查中", value: "核查中" },
  { label: "已移送", value: "已移送" },
];
</script>

<template>
  <div class="space-y-5">
    <div class="app-card p-5">
      <el-form :inline="true" size="default" class="flex flex-wrap items-center">
        <el-form-item label="案件编号" class="!mb-0">
          <el-input v-model="caseFilter.id" placeholder="如：2024-京二检-001" class="!w-[180px]" />
        </el-form-item>
        <el-form-item label="嫌疑人" class="!mb-0">
          <el-input v-model="caseFilter.name" placeholder="输入姓名" class="!w-[140px]" />
        </el-form-item>
        <el-form-item label="涉案品牌" class="!mb-0">
          <el-select v-model="caseFilter.brand" class="!w-[150px]">
            <el-option v-for="o in brandOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="案件状态" class="!mb-0">
          <el-select v-model="caseFilter.status" class="!w-[130px]">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="flex justify-between items-center mt-2">
        <PrimaryButton type="primary" :icon="Plus">录入新案件</PrimaryButton>
        <div class="flex gap-2">
          <el-button @click="resetFilter">重置</el-button>
        </div>
      </div>
    </div>

    <div class="app-card p-6">
      <div class="flex justify-between items-center mb-4">
        <div class="card-title !mb-0">案件列表（共 {{ cases.length }} 件）</div>
      </div>
      <el-table :data="cases" stripe class="w-full" @row-click="openDetail">
        <el-table-column prop="id" label="案件编号" width="180" />
        <el-table-column prop="suspect" label="主要嫌疑人" width="140" />
        <el-table-column prop="brand" label="涉案品牌" width="160" />
        <el-table-column label="涉案金额" width="120" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-red-600">{{ row.amount }}万元</span>
          </template>
        </el-table-column>
        <el-table-column prop="clues" label="线索数" width="80" align="center" />
        <el-table-column label="风险标签" width="260">
          <template #default="{ row }">
            <span v-if="row.tags.includes('价格异常')" class="tag-danger mr-1">价格异常</span>
            <span v-if="row.tags.includes('主观明知')" class="tag-danger mr-1">主观明知</span>
            <span v-if="row.tags.includes('跨省销售')" class="tag-warning mr-1">跨省销售</span>
            <span v-if="row.tags.includes('多案关联')" class="tag-purple mr-1">多案关联</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130">
          <template #default="{ row }">
            <el-button link type="primary" class="!text-[#1A3A5C] !font-semibold" @click.stop="openDetail(row)">
              查看详情 →
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogOpen" :title="'案件详情 — ' + (currentCase?.id ?? '')" width="900px" :append-to-body="true">
      <template #header>
        <span class="text-base font-semibold">案件详情 — {{ currentCase?.id }}</span>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button :icon="Edit" @click="ElMessage.info('修改功能开发中')">修改</el-button>
          <el-button :icon="Delete" type="danger" @click="ElMessage.warning('删除功能开发中')">删除</el-button>
          <el-button @click="dialogOpen = false">关闭</el-button>
        </div>
      </template>
      <div v-if="currentCase && detailData">
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div class="p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p class="text-xs font-semibold mb-2 text-gray-500">嫌疑人信息</p>
            <p class="font-bold text-lg text-[#1A3A5C]">{{ currentCase.suspect }}</p>
            <p class="text-sm mt-1 text-gray-600">涉案产品：{{ currentCase.brand }}</p>
          </div>
          <div class="p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p class="text-xs font-semibold mb-2 text-gray-500">案件概览</p>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <p class="text-xl font-bold text-red-600">{{ currentCase.amount }}</p>
                <p class="text-xs text-gray-500">涉案金额(万)</p>
              </div>
              <div>
                <p class="text-xl font-bold text-[#1A3A5C]">{{ currentCase.clues }}</p>
                <p class="text-xs text-gray-500">线索数</p>
              </div>
              <div>
                <p class="text-xl font-bold text-[#1A3A5C]">{{ currentCase.linked }}</p>
                <p class="text-xs text-gray-500">关联案件</p>
              </div>
            </div>
          </div>
        </div>

        <TabButton
          v-model="detailTab"
          :tabs="[
            { key: 'chat', label: '聊天记录' },
            { key: 'trade', label: '交易记录' },
            { key: 'relation', label: '人物关系' },
            { key: 'report', label: '导出报告' }
          ]"
        />

        <div v-if="detailTab === 'chat'">
          <div
            class="rounded-lg p-4 text-sm bg-gray-50 border border-gray-200 font-mono leading-relaxed"
          >
            <p>刘某某: 老曹，<span class="price-highlight">奥迪A4L那款轮毂280一个</span>，正品要600多，要50个吗？</p>
            <p>曹某某: 行，先来50个。</p>
            <p>刘某某: 这批货你别声张，<span class="chat-highlight">不是原厂的</span>，老规矩。</p>
            <p>曹某某: 放心，我心里有数。发圆通到哈尔滨。</p>
            <p>曹某某: 钱打农行卡，户名刘某某，尾号<span class="chat-highlight">4589</span>。</p>
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <span class="tag-danger">命中词：不是原厂</span>
            <span class="tag-danger">命中词：老规矩</span>
            <span class="tag-danger">命中词：280元（低于参考价50%）</span>
            <span class="tag-info">收款账号：农行***4589</span>
          </div>
        </div>

        <div v-if="detailTab === 'trade'">
          <el-table :data="detailData.trades" stripe size="small">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="product" label="产品" />
            <el-table-column prop="buyer" label="买家" width="140" />
            <el-table-column label="金额" width="110" align="right">
              <template #default="scope">
                <span class="text-red-600 font-semibold">{{ scope.row.amount }}元</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="detailTab === 'relation'" class="text-center py-8">
          <p class="text-gray-400">人物关系图将在关联分析页面统一展示</p>
          <el-button type="primary" class="!bg-[#1A3A5C] !border-[#1A3A5C] !mt-4" @click="router.push('/relations')">
            前往关联分析
          </el-button>
        </div>

        <div v-if="detailTab === 'report'" class="text-center py-8">
          <p class="mb-4 text-gray-500">根据案件分析结果生成标准化检察报告</p>
          <el-button type="success" size="large" :icon="Document" class="!bg-[#27AE60] !border-[#27AE60]">
            导出 Word 分析报告
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
