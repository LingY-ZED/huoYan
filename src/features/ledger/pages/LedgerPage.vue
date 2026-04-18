<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useRoute, RouterView } from "vue-router";
import { ElButton, ElTable, ElTableColumn, ElDialog, ElInput, ElSelect, ElOption, ElMessage, ElCheckbox, ElLoading, ElIcon } from "element-plus";
import { Document, Download, Edit, Search } from "@element-plus/icons-vue";
import { repositories } from "@/services";
import { maskPhone, maskName } from "@/utils/masking";

const route = useRoute();
const ledgerTab = ref<"fund" | "person" | "report" | "evidence">("person");

// 监听路由变化，自动切换 tab
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/ledger/person")) {
      ledgerTab.value = "person";
    } else if (newPath.includes("/ledger/fund")) {
      ledgerTab.value = "fund";
    } else if (newPath.includes("/ledger/evidence")) {
      ledgerTab.value = "evidence";
    } else if (newPath.includes("/ledger/report")) {
      ledgerTab.value = "report";
    }
  },
  { immediate: true }
);

// 加载状态
const loading = ref(false);
const fundLoading = ref(false);
const personLoading = ref(false);

// 资金流水数据
const fundRecords = ref<any[]>([]);

const personFilter = ref({ name: "", role: "", case_no: "" });
const caseOptions = ref<any[]>([]);

// 人员台账数据
const personList = ref<any[]>([]);

const totalFundAmount = computed(() => {
  return fundRecords.value.reduce((sum, item) => sum + (item.amount || 0), 0);
});
const totalFundCases = computed(() => {
  return new Set(fundRecords.value.map(item => item.case_id).filter(Boolean)).size;
});
const totalFundPersons = computed(() => {
  const persons = new Set();
  fundRecords.value.forEach(item => {
    if (item.payer) persons.add(item.payer);
    if (item.payee) persons.add(item.payee);
  });
  return persons.size;
});

const totalPersonAmount = computed(() => {
  return personList.value.reduce((sum, item) => sum + (item.illegal_business_amount || 0), 0);
});
const coreSuspectCount = computed(() => {
  return personList.value.filter(item => item.role === '核心嫌疑人').length;
});
const totalLinkedCases = computed(() => {
  return personList.value.reduce((sum, item) => sum + (item.linked_cases || 0), 0);
});

// 加载案件选项
async function loadCaseOptions() {
  try {
    const response = await repositories.cases.listCases({
      limit: 100,
      offset: 0,
    });
    if (Array.isArray(response)) {
      caseOptions.value = [
        { label: "全部案件", value: "" },
        ...response.map(c => ({
          label: `${c.case_no} — ${c.suspect_name}`,
          value: c.case_no
        }))
      ];
    } else if (response.code === 0) {
      caseOptions.value = [
        { label: "全部案件", value: "" },
        ...response.data!.list.map(c => ({
          label: `${c.case_no} — ${c.suspect_name}`,
          value: c.case_no
        }))
      ];
    }
  } catch (error) {
    console.error("加载案件选项失败:", error);
  }
}

const fundFilter = ref({
  case_no: "",
  payer: "",
  payee: "",
  dateRange: null as [Date, Date] | null
});

function resetFundFilter() {
  fundFilter.value = { case_no: "", payer: "", payee: "", dateRange: null };
  loadFundRecords();
}

let fundSearchTimeout: number | undefined;
watch(fundFilter, () => {
  if (fundSearchTimeout) clearTimeout(fundSearchTimeout);
  fundSearchTimeout = window.setTimeout(() => {
    loadFundRecords();
  }, 400);
}, { deep: true });

// 加载资金流水数据
async function loadFundRecords() {
  fundLoading.value = true;
  try {
    const params: any = {
      case_no: fundFilter.value.case_no || undefined,
      payer: fundFilter.value.payer || undefined,
      payee: fundFilter.value.payee || undefined,
    };
    if (fundFilter.value.dateRange && fundFilter.value.dateRange.length === 2) {
      params.start_date = new Date(fundFilter.value.dateRange[0]).toISOString().split('T')[0];
      params.end_date = new Date(fundFilter.value.dateRange[1]).toISOString().split('T')[0];
    }
    const response = await repositories.relations.getFundFlows(params);
    if (Array.isArray(response)) {
      fundRecords.value = response;
    } else if (response.code === 0) {
      fundRecords.value = response.data || [];
    }
  } catch (error) {
    ElMessage.error("获取资金流水失败，请稍后重试");
    console.error("获取资金流水失败:", error);
  } finally {
    fundLoading.value = false;
  }
}

// 加载人员台账数据
async function loadPersonList() {
  personLoading.value = true;
  try {
    const response = await repositories.relations.getPersonLedger();
    if (Array.isArray(response)) {
      personList.value = response;
    } else if (response.code === 0) {
      personList.value = response.data || [];
    }
  } catch (error) {
    ElMessage.error("获取人员台账失败，请稍后重试");
    console.error("获取人员台账失败:", error);
  } finally {
    personLoading.value = false;
  }
}

// 监听 tab 变化，加载对应数据
watch(
  () => ledgerTab.value,
  (newTab) => {
    if (newTab === 'fund') {
      loadFundRecords();
    } else if (newTab === 'person') {
      loadPersonList();
    }
  }
);

// 组件挂载时加载数据
onMounted(() => {
  loadCaseOptions();
  if (ledgerTab.value === 'fund') {
    loadFundRecords();
  } else if (ledgerTab.value === 'person') {
    loadPersonList();
  }
});


const roleOptions = computed(() => {
  const roles = new Set<string>();
  personList.value.forEach(p => {
    if (p.role) roles.add(p.role);
  });
  return Array.from(roles).map(role => ({ label: role, value: role }));
});



const filteredPersonList = computed(() => {
  return personList.value.filter((person) => {
    const matchName = personFilter.value.name === "" || person.name.includes(personFilter.value.name);
    const matchRole = personFilter.value.role === "" || person.role === personFilter.value.role;
    return matchName && matchRole;
  });
});


function resetPersonFilter() {
  personFilter.value = { name: "", role: "", case_no: "" };
}

// 导出功能
async function exportExcel(type: 'persons' | 'transactions') {
  const loading = ElLoading.service({ fullscreen: true, text: '正在导出数据...' });
  
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
    let requestUrl = `${baseUrl}/export/csv?type=${type}`;
    
    if (type === 'transactions' && fundFilter.value.case_no) {
      requestUrl += `&case_no=${encodeURIComponent(fundFilter.value.case_no)}`;
    } else if (type === 'persons' && personFilter.value.case_no) {
      requestUrl += `&case_no=${encodeURIComponent(personFilter.value.case_no)}`;
    }

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });
    
    if (!response.ok) {
      throw new Error('导出失败');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `导出数据_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败，请稍后重试');
    console.error('导出失败:', error);
  } finally {
    loading.close();
  }
}
</script>

<template>
  <div class="space-y-5">
    <div v-show="ledgerTab === 'fund'">
      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">💰 已查明流水总额</p>
          <p class="text-3xl font-black text-red-600">¥{{ totalFundAmount.toLocaleString() }}</p>
          <p class="text-xs mt-1 text-gray-400">元</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📋 资金记录数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">{{ fundRecords.length }}</p>
          <p class="text-xs mt-1 text-gray-400">笔</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📁 涉案案件数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">{{ totalFundCases }}</p>
          <p class="text-xs mt-1 text-gray-400">件</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">👥 涉案人员数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">{{ totalFundPersons }}</p>
          <p class="text-xs mt-1 text-gray-400">人</p>
        </div>
      </div>

      <div class="app-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title !mb-0">💸 资金流水明细</h3>
          <div class="flex gap-2">
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD" @click="exportExcel('transactions')">导出 Excel</el-button>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 mb-4 items-center">
          <el-select v-model="fundFilter.case_no" placeholder="关联案件" class="!w-[180px]" clearable>
            <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input v-model="fundFilter.payer" placeholder="付款方" :prefix-icon="Search" class="!w-[140px]" clearable />
          <el-input v-model="fundFilter.payee" placeholder="收款方" :prefix-icon="Search" class="!w-[140px]" clearable />
          <el-date-picker v-model="fundFilter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
          <el-button @click="resetFundFilter">重置</el-button>
        </div>
        <el-table :data="fundRecords" stripe size="small" v-loading="fundLoading">
          <el-table-column prop="transaction_time" label="日期" width="110" />
          <el-table-column prop="payer" label="付款方" width="120">
            <template #default="scope">
              <span>{{ maskName(scope.row.payer) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payee" label="收款方" width="120">
            <template #default="scope">
              <span>{{ maskName(scope.row.payee) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="130" align="right">
            <template #default="scope">
              <span class="font-bold text-red-600">¥{{ scope.row.amount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_method" label="渠道" width="110">
            <template #default="scope">
              <span class="tag-info">{{ scope.row.payment_method }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="case_id" label="关联案件" width="160" />
        </el-table>
      </div>
    </div>

    <div v-show="ledgerTab === 'person'">
      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">👥 涉案人员总数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">{{ personList.length }}</p>
          <p class="text-xs mt-1 text-gray-400">人</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">💰 嫌疑人涉案累加额</p>
          <p class="text-3xl font-black text-red-600">¥{{ totalPersonAmount.toLocaleString() }}</p>
          <p class="text-xs mt-1 text-gray-400">元</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">⚠️ 核心嫌疑人</p>
          <p class="text-3xl font-black text-red-600">{{ coreSuspectCount }}</p>
          <p class="text-xs mt-1 text-gray-400">人</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📁 关联案件总数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">{{ totalLinkedCases }}</p>
          <p class="text-xs mt-1 text-gray-400">件</p>
        </div>
      </div>

      <div class="app-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title !mb-0">👤 人物台账管理</h3>
          <div class="flex gap-2">
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD" @click="exportExcel('persons')">导出 Excel</el-button>
          </div>
        </div>
        <div class="flex gap-4 mb-4 items-center">
          <el-select v-model="personFilter.case_no" placeholder="选择关联案件" class="!w-[180px]" clearable>
            <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input v-model="personFilter.name" placeholder="搜索姓名" :prefix-icon="Search" class="!w-[140px]" clearable />
          <el-select v-model="personFilter.role" placeholder="选择角色" class="!w-[180px]" clearable>
            <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button @click="resetPersonFilter">重置</el-button>
        </div>
        <el-table :data="filteredPersonList" stripe size="small" v-loading="personLoading">
          <el-table-column prop="name" label="姓名" width="120">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ maskName(scope.row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="130">
            <template #default="scope">
              <span
                class="px-2 py-1 rounded text-xs font-semibold"
                :style="{
                  background: scope.row.role === '核心嫌疑人' ? '#FDECEA' : scope.row.role === '上游供货商' ? '#EEF3F8' : scope.row.role === '下游买家' ? '#F0FAF0' : '#F5F8FA',
                  color: scope.row.role === '核心嫌疑人' ? '#C0392B' : scope.row.role === '上游供货商' ? '#1E293B' : scope.row.role === '下游买家' ? '#27AE60' : '#1A3A5C',
                }"
              >
                {{ scope.row.role }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="is_authorized" label="是否授权" width="100" align="center">
            <template #default="scope">
              <span class="px-2 py-1 rounded text-xs font-semibold" :style="{
                background: scope.row.is_authorized ? '#F0FAF0' : '#FDECEA',
                color: scope.row.is_authorized ? '#27AE60' : '#C0392B'
              }">
                {{ scope.row.is_authorized ? '是' : '否' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="subjective_knowledge_score" label="主观明知评分" width="120" align="center">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ scope.row.subjective_knowledge_score }}/10</span>
            </template>
          </el-table-column>
          <el-table-column label="涉案金额" width="130" align="right">
            <template #default="scope">
              <span class="font-bold text-red-600">¥{{ scope.row.illegal_business_amount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="linked_cases" label="管理案件数量" width="110" align="center">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ scope.row.linked_cases }} 件</span>
            </template>
          </el-table-column>

        </el-table>
      </div>
    </div>

    <div v-show="ledgerTab === 'report'">
      <div class="app-card p-10 flex flex-col items-center justify-center" style="min-height: 500px">
        <el-icon :size="80" style="color: #D0D5DD"><Document /></el-icon>
        <h3 class="text-xl font-bold mt-8 mb-3 text-[#1A3A5C]">📊 统计报表</h3>
        <p class="text-base mb-2 text-gray-600">资金汇总、案件统计、证据分析报表</p>
        <p class="text-sm mb-8 text-gray-400">将在 P1 接入数据服务后启用，数据将自动汇总计算</p>
        <div class="grid grid-cols-3 gap-6 w-full max-w-2xl">
          <div class="app-card p-5 text-center">
            <p class="text-3xl mb-2">📁</p>
            <p class="font-bold text-[#1A3A5C]">案件统计报表</p>
            <p class="text-xs mt-1 text-gray-400">按状态/品牌/金额分布</p>
          </div>
          <div class="app-card p-5 text-center">
            <p class="text-3xl mb-2">💰</p>
            <p class="font-bold text-[#1A3A5C]">资金分析报表</p>
            <p class="text-xs mt-1 text-gray-400">按时间/渠道/对手汇总</p>
          </div>
          <div class="app-card p-5 text-center">
            <p class="text-3xl mb-2">📄</p>
            <p class="font-bold text-[#1A3A5C]">证据分析报表</p>
            <p class="text-xs mt-1 text-gray-400">按类型/来源/状态统计</p>
          </div>
        </div>
      </div>
    </div>


    <div v-if="ledgerTab === 'evidence'">
      <RouterView />
    </div>
  </div>
</template>