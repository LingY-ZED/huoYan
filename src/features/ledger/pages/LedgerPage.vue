<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { ElButton, ElTable, ElTableColumn, ElDialog, ElInput, ElSelect, ElMessage } from "element-plus";
import { Document, Download, Edit, Search } from "@element-plus/icons-vue";

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

const fundRecords = ref([
  { date: "2024-03-10", from: "曹某某", to: "刘某某", amount: 20200, channel: "银行转账", caseId: "2024-京二检-001" },
  { date: "2024-03-10", from: "曹某某", to: "经销商A", amount: 14000, channel: "微信转账", caseId: "2024-京二检-001" },
  { date: "2024-03-12", from: "曹某某", to: "刘某某", amount: 8400, channel: "银行转账", caseId: "2024-京二检-001" },
  { date: "2024-03-08", from: "刘某某", to: "曹某某", amount: 15200, channel: "支付宝转账", caseId: "2024-京二检-002" },
  { date: "2024-03-14", from: "陈某强", to: "曹某某", amount: 18600, channel: "银行转账", caseId: "2024-京二检-003" },
]);

const personFilter = ref({ name: "", caseId: "" });
const caseOptions = [
  { label: "全部案件", value: "" },
  { label: "2024-京二检-001 — 曹某某", value: "2024-京二检-001" },
  { label: "2024-京二检-002 — 刘某某", value: "2024-京二检-002" },
  { label: "2024-京二检-003 — 陈某强", value: "2024-京二检-003" },
  { label: "2024-京二检-004 — 周某某", value: "2024-京二检-004" },
];

const personList = ref([
  { id: 1, name: "曹某某", role: "核心嫌疑人", amount: 156800, caseCount: 4, phone: "138****5678" },
  { id: 2, name: "刘某某", role: "下游买家", amount: 89200, caseCount: 2, phone: "139****1234" },
  { id: 3, name: "陈某强", role: "上游供货商", amount: 67500, caseCount: 3, phone: "137****9876" },
  { id: 4, name: "周某某", role: "中间商", amount: 45300, caseCount: 1, phone: "136****5432" },
  { id: 5, name: "经销商A", role: "上游供货商", amount: 32800, caseCount: 2, phone: "135****8765" },
  { id: 6, name: "李某华", role: "资金账户持有人", amount: 28600, caseCount: 1, phone: "158****2468" },
]);

const editDialogVisible = ref(false);
const editingPerson = ref<any>(null);
const editForm = ref({
  name: "",
  role: "",
  amount: 0,
  caseCount: 0,
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

const filteredPersonList = computed(() => {
  return personList.value.filter((person) => {
    const matchName = personFilter.value.name === "" || person.name.includes(personFilter.value.name);
    return matchName;
  });
});

function openEditDialog(person: any) {
  editingPerson.value = person;
  editForm.value = {
    name: person.name,
    role: person.role,
    amount: person.amount,
    caseCount: person.caseCount,
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
        amount: editForm.value.amount,
        caseCount: editForm.value.caseCount,
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
  personFilter.value = { name: "", caseId: "" };
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
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD">导出 Excel</el-button>
            <el-button size="small" type="primary" :icon="Document" style="background: #1A3A5C; border-color: #1A3A5C">新增记录</el-button>
          </div>
        </div>
        <el-table :data="fundRecords" stripe size="small">
          <el-table-column prop="date" label="日期" width="110" />
          <el-table-column prop="from" label="付款方" width="120" />
          <el-table-column prop="to" label="收款方" width="120" />
          <el-table-column label="金额" width="130" align="right">
            <template #default="scope">
              <span class="font-bold text-red-600">¥{{ scope.row.amount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="channel" label="渠道" width="110">
            <template #default="scope">
              <span class="tag-info">{{ scope.row.channel }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="caseId" label="关联案件" width="160" />
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
            <el-button size="small" :icon="Download" style="color: #1A3A5C; border-color: #D0D5DD">导出 Excel</el-button>
            <el-button size="small" type="primary" :icon="Document" style="background: #1A3A5C; border-color: #1A3A5C">新增人员</el-button>
          </div>
        </div>
        <div class="flex gap-4 mb-4 items-center">
          <el-input v-model="personFilter.name" placeholder="搜索姓名" :prefix-icon="Search" class="!w-[180px]" clearable />
          <el-select v-model="personFilter.caseId" placeholder="选择案件" class="!w-[220px]" clearable>
            <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button @click="resetPersonFilter">重置</el-button>
        </div>
        <el-table :data="filteredPersonList" stripe size="small">
          <el-table-column prop="name" label="姓名" width="140">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="150">
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
          <el-table-column label="涉案金额" width="150" align="right">
            <template #default="scope">
              <span class="font-bold text-red-600">¥{{ scope.row.amount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="caseCount" label="管理案件数量" width="130" align="center">
            <template #default="scope">
              <span class="font-semibold text-[#1A3A5C]">{{ scope.row.caseCount }} 件</span>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="联系电话" width="140">
            <template #default="scope">
              <span class="font-mono text-sm text-gray-600">{{ scope.row.phone }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
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
          <label class="w-24 text-sm font-semibold text-gray-500">涉案金额</label>
          <el-input v-model.number="editForm.amount" type="number" placeholder="请输入涉案金额" class="flex-1">
            <template #prepend>¥</template>
          </el-input>
        </div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-500">管理案件数量</label>
          <el-input v-model.number="editForm.caseCount" type="number" placeholder="请输入案件数量" class="flex-1">
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
