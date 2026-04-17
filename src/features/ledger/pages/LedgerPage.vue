<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElButton, ElTable, ElTableColumn, ElDialog, ElInput, ElSelect, ElMessage, ElCheckbox, ElLoading } from "element-plus";
import { Document, Download, Edit, Search } from "@element-plus/icons-vue";
import { repositories } from "@/services";

const route = useRoute();
const ledgerTab = ref<"fund" | "person" | "report">("person");

// 监听路由变化，自动切换 tab
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/ledger/person")) {
      ledgerTab.value = "person";
    } else if (newPath.includes("/ledger/fund")) {
      ledgerTab.value = "fund";
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

const personFilter = ref({ name: "", role: "" });
const caseOptions = ref<any[]>([]);

// 人员台账数据
const personList = ref<any[]>([]);

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

// 加载资金流水数据
async function loadFundRecords() {
  fundLoading.value = true;
  try {
    const response = await repositories.relations.getFundFlows();
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

const editDialogVisible = ref(false);
const editingPerson = ref<any>(null);
const editForm = ref({
  name: "",
  role: "",
  is_authorized: false,
  subjective_knowledge_score: 0,
  illegal_business_amount: 0,
  linked_cases: 0,
  phone: "",
});

const roleOptions = [
  { label: "核心嫌疑人", value: "核心嫌疑人" },
  { label: "上游供货商", value: "上游供货商" },
  { label: "下游买家", value: "下游买家" },
  { label: "中间商", value: "中间商" },
  { label: "资金账户持有人", value: "资金账户持有人" },
  { label: "证人", value: "证人" },
];

// 联系方式脱敏函数
function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

const filteredPersonList = computed(() => {
  return personList.value.filter((person) => {
    const matchName = personFilter.value.name === "" || person.name.includes(personFilter.value.name);
    const matchRole = personFilter.value.role === "" || person.role === personFilter.value.role;
    return matchName && matchRole;
  });
});

function openEditDialog(person: any) {
  editingPerson.value = person;
  editForm.value = {
    name: person.name,
    role: person.role,
    is_authorized: person.is_authorized,
    subjective_knowledge_score: person.subjective_knowledge_score,
    illegal_business_amount: person.illegal_business_amount,
    linked_cases: person.linked_cases,
    phone: person.phone,
  };
  editDialogVisible.value = true;
}

function saveEdit() {
  if (editingPerson.value) {
    const index = personList.value.findIndex((p) => p.id === editingPerson.value.id);
    if (index !== -1) {
      personList.value[index] = {
        ...personList.value[index],
        name: editForm.value.name,
        role: editForm.value.role,
        is_authorized: editForm.value.is_authorized,
        subjective_knowledge_score: editForm.value.subjective_knowledge_score,
        illegal_business_amount: editForm.value.illegal_business_amount,
        linked_cases: editForm.value.linked_cases,
        phone: editForm.value.phone,
      };
    }
  }
  editDialogVisible.value = false;
  ElMessage.success("修改成功");
}

function cancelEdit() {
  editDialogVisible.value = false;
  editingPerson.value = null;
}

function resetPersonFilter() {
  personFilter.value = { name: "", role: "" };
}

// 导出功能
async function exportExcel(type: 'persons' | 'transactions') {
  const loading = ElLoading.service({ fullscreen: true, text: '正在导出数据...' });
  
  try {
    const response = await fetch(`http://localhost:8000/api/export/csv?type=${type}`, {
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
          <p class="text-xs font-semibold mb-2 text-gray-500">💰 累计涉案金额</p>
          <p class="text-3xl font-black text-red-600">¥286,500</p>
          <p class="text-xs mt-1 text-gray-400">元</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📋 资金记录数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">47</p>
          <p class="text-xs mt-1 text-gray-400">笔</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📁 涉案案件数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">4</p>
          <p class="text-xs mt-1 text-gray-400">件</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">👥 涉案人员数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">9</p>
          <p class="text-xs mt-1 text-gray-400">人</p>
        </div>
      </div>

      <div class="app-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title !mb-0">💸 资金流水明细</h3>
          <div class="flex gap-2">
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD" @click="exportExcel('transactions')">导出 Excel</el-button>
            <el-button size="small" type="primary" :icon="Document" style="background: #1A3A5C; border-color: #1A3A5C">新增记录</el-button>
          </div>
        </div>
        <el-table :data="fundRecords" stripe size="small" v-loading="fundLoading">
          <el-table-column prop="transaction_time" label="日期" width="110" />
          <el-table-column prop="payer" label="付款方" width="120" />
          <el-table-column prop="payee" label="收款方" width="120" />
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
          <p class="text-xs font-semibold mb-2 text-gray-500">💰 累计涉案金额</p>
          <p class="text-3xl font-black text-red-600">¥420,200</p>
          <p class="text-xs mt-1 text-gray-400">元</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">⚠️ 核心嫌疑人</p>
          <p class="text-3xl font-black text-red-600">1</p>
          <p class="text-xs mt-1 text-gray-400">人</p>
        </div>
        <div class="app-card text-center p-5">
          <p class="text-xs font-semibold mb-2 text-gray-500">📁 关联案件总数</p>
          <p class="text-3xl font-black text-[#1A3A5C]">13</p>
          <p class="text-xs mt-1 text-gray-400">件</p>
        </div>
      </div>

      <div class="app-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-title !mb-0">👤 人物台账管理</h3>
          <div class="flex gap-2">
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD" @click="exportExcel('persons')">导出 Excel</el-button>
            <el-button size="small" type="primary" :icon="Document" style="background: #1A3A5C; border-color: #1A3A5C">新增人员</el-button>
          </div>
        </div>
        <div class="flex gap-4 mb-4 items-center">
          <el-input v-model="personFilter.name" placeholder="搜索姓名" :prefix-icon="Search" class="!w-[180px]" clearable />
          <el-select v-model="personFilter.role" placeholder="选择角色" class="!w-[220px]" clearable>
            <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button @click="resetPersonFilter">重置</el-button>
        </div>
        <el-table :data="filteredPersonList" stripe size="small" v-loading="personLoading">
          <el-table-column prop="name" label="姓名" width="120">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ scope.row.name }}</span>
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
          <el-table-column prop="phone" label="联系电话" width="130">
            <template #default="scope">
              <span class="font-mono text-sm text-gray-600">{{ maskPhone(scope.row.phone) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="scope">
              <el-button link type="primary" size="small" :icon="Edit" style="color: #1A3A5C; font-weight: 600" @click="openEditDialog(scope.row)">修改</el-button>
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

    <el-dialog v-model="editDialogVisible" title="修改人员信息" width="500px" :close-on-click-modal="false">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">姓名</label>
          <el-input v-model="editForm.name" placeholder="请输入姓名" class="flex-1" />
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">角色</label>
          <el-select v-model="editForm.role" placeholder="请选择角色" class="flex-1">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">是否授权</label>
          <el-checkbox v-model="editForm.is_authorized">授权经销商</el-checkbox>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">主观明知评分</label>
          <el-input v-model.number="editForm.subjective_knowledge_score" type="number" min="0" max="10" placeholder="0-10分" class="flex-1">
            <template #append>分</template>
          </el-input>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">涉案金额</label>
          <el-input v-model.number="editForm.illegal_business_amount" type="number" placeholder="请输入涉案金额" class="flex-1">
            <template #prepend>¥</template>
          </el-input>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">关联案件数</label>
          <el-input v-model.number="editForm.linked_cases" type="number" placeholder="请输入案件数量" class="flex-1">
            <template #append>件</template>
          </el-input>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">联系电话</label>
          <el-input v-model="editForm.phone" placeholder="请输入联系电话" class="flex-1" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" class="!bg-[#1A3A5C] !border-[#1A3A5C]" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>