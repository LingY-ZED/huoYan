<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  ElFormRules,
  ElLoading,
} from "element-plus";
import { Document, Plus, Edit, Delete } from "@element-plus/icons-vue";
import { repositories } from "@/services";
import type { CaseSummary } from "@/entities/case";
import { PrimaryButton, TabButton } from "@/shared/components";

const router = useRouter();
const dialogOpen = ref(false);
const addDialogOpen = ref(false);
const detailTab = ref("chat");
const currentCase = ref<CaseSummary | null>(null);
const caseFilter = ref({ case_no: "", suspect_name: "", brand: "" });
const cases = ref<CaseSummary[]>([]);
const detailData = ref<any>(null);
const loading = ref(false);
const detailLoading = ref(false);

// 新增案件表单数据
const addCaseForm = ref({
  case_no: "",
  suspect_name: "",
  brand: "",
  amount: 0,
});

// 表单引用
const addCaseFormRef = ref();

// 修改案件弹窗控制
const editDialogOpen = ref(false);

// 修改案件表单数据
const editCaseForm = ref({
  suspect_name: "",
  brand: "",
  amount: 0,
});

// 表单引用
const editCaseFormRef = ref();

// 表单验证规则
const addCaseRules = ref<ElFormRules>({
  case_no: [
    { required: true, message: "请输入案件编号", trigger: "blur" },
  ],
  suspect_name: [
    { required: true, message: "请输入嫌疑人姓名", trigger: "blur" },
  ],
  brand: [
    { required: true, message: "请选择涉案品牌", trigger: "change" },
  ],
  amount: [
    { required: true, message: "请输入涉案金额", trigger: "blur" },
    { type: "number", min: 0, message: "涉案金额必须大于等于0", trigger: "blur" },
  ],
});

// 修改案件表单验证规则
const editCaseRules = ref<ElFormRules>({
  suspect_name: [
    { required: true, message: "请输入嫌疑人姓名", trigger: "blur" },
  ],
  brand: [
    { required: true, message: "请输入涉案品牌", trigger: "blur" },
  ],
  amount: [
    { required: true, message: "请输入涉案金额", trigger: "blur" },
    { type: "number", min: 0, message: "涉案金额必须大于等于0", trigger: "blur" },
  ],
});

// 加载案件列表
async function loadCases() {
  loading.value = true;
  try {
    const response = await repositories.cases.listCases({
      case_no: caseFilter.value.case_no,
      suspect_name: caseFilter.value.suspect_name,
      brand: caseFilter.value.brand,
      limit: 100,
      offset: 0,
    });
    // 处理不同的响应格式
    if (Array.isArray(response)) {
      // 直接返回数组的情况
      cases.value = response;
    } else if (response.code === 0) {
      // 标准格式的情况
      cases.value = response.data!.list;
    } else {
      ElMessage.error("获取案件列表失败");
    }
  } catch (error) {
    ElMessage.error("获取案件列表失败，请稍后重试");
    console.error("获取案件列表失败:", error);
  } finally {
    loading.value = false;
  }
}

// 加载案件详情
async function loadCaseDetail(caseId: string) {
  detailLoading.value = true;
  try {
    const response = await repositories.cases.getCaseDetail(caseId);
    // 处理不同的响应格式
    if (response.code === 0) {
      // 标准格式的情况
      detailData.value = response.data;
    } else {
      // 直接返回数据的情况
      detailData.value = response;
    }
  } catch (error) {
    ElMessage.error("获取案件详情失败，请稍后重试");
    console.error("获取案件详情失败:", error);
  } finally {
    detailLoading.value = false;
  }
}

function openDetail(row: CaseSummary) {
  currentCase.value = row;
  detailTab.value = "chat";
  dialogOpen.value = true;
  loadCaseDetail(row.id.toString());
}

function resetFilter() {
  caseFilter.value = { case_no: "", suspect_name: "", brand: "" };
  loadCases();
}

// 打开新增案件弹窗
function openAddDialog() {
  addCaseForm.value = {
    case_no: "",
    suspect_name: "",
    brand: "",
    amount: 0,
  };
  addDialogOpen.value = true;
}

// 提交新增案件
async function submitAddCase() {
  try {
    const response = await repositories.cases.createCase(addCaseForm.value);
    // 处理不同的响应格式
    if (response.code === 0) {
      // 标准格式的情况
      ElMessage.success("案件添加成功");
      addDialogOpen.value = false;
      loadCases(); // 重新加载案件列表
    } else if (response) {
      // 直接返回数据的情况
      ElMessage.success("案件添加成功");
      addDialogOpen.value = false;
      loadCases(); // 重新加载案件列表
    } else {
      ElMessage.error("添加案件失败");
    }
  } catch (error) {
    ElMessage.error("添加案件失败，请稍后重试");
    console.error("添加案件失败:", error);
  }
}

// 打开修改弹窗
function openEditDialog() {
  if (currentCase.value) {
    editCaseForm.value = {
      suspect_name: currentCase.value.suspect_name,
      brand: currentCase.value.brand,
      amount: currentCase.value.amount,
    };
    editDialogOpen.value = true;
  }
}

// 提交修改案件
async function submitEditCase() {
  try {
    if (!currentCase.value) return;
    
    const response = await repositories.cases.updateCase(currentCase.value.id.toString(), editCaseForm.value);
    // 处理不同的响应格式
    if (response.code === 0) {
      // 标准格式的情况
      ElMessage.success("案件修改成功");
      editDialogOpen.value = false;
      loadCases(); // 重新加载案件列表
      loadCaseDetail(currentCase.value.id.toString()); // 重新加载案件详情
    } else if (response) {
      // 直接返回数据的情况
      ElMessage.success("案件修改成功");
      editDialogOpen.value = false;
      loadCases(); // 重新加载案件列表
      loadCaseDetail(currentCase.value.id.toString()); // 重新加载案件详情
    } else {
      ElMessage.error("修改案件失败");
    }
  } catch (error) {
    ElMessage.error("修改案件失败，请稍后重试");
    console.error("修改案件失败:", error);
  }
}

// 删除案件
async function deleteCase() {
  try {
    if (!currentCase.value) return;
    
    const response = await repositories.cases.deleteCase(currentCase.value.id.toString());
    // 处理不同的响应格式
    if (response.code === 0) {
      // 标准格式的情况
      ElMessage.success("案件删除成功");
      dialogOpen.value = false;
      loadCases(); // 重新加载案件列表
    } else if (response) {
      // 直接返回数据的情况
      ElMessage.success("案件删除成功");
      dialogOpen.value = false;
      loadCases(); // 重新加载案件列表
    } else {
      ElMessage.error("删除案件失败");
    }
  } catch (error) {
    ElMessage.error("删除案件失败，请稍后重试");
    console.error("删除案件失败:", error);
  }
}

// 组件挂载时加载案件列表
onMounted(() => {
  loadCases();
});


</script>

<template>
  <div class="space-y-5">
    <div class="app-card p-5">
      <el-form :inline="true" size="default" class="flex flex-wrap items-center">
        <el-form-item label="案件编号" class="!mb-0">
          <el-input v-model="caseFilter.case_no" placeholder="如：CASE001" class="!w-[180px]" @keyup.enter="loadCases" />
        </el-form-item>
        <el-form-item label="嫌疑人" class="!mb-0">
          <el-input v-model="caseFilter.suspect_name" placeholder="输入姓名" class="!w-[140px]" @keyup.enter="loadCases" />
        </el-form-item>
        <el-form-item label="涉案品牌" class="!mb-0">
          <el-input v-model="caseFilter.brand" placeholder="输入品牌" class="!w-[150px]" @keyup.enter="loadCases" />
        </el-form-item>
      </el-form>
      <div class="flex justify-between items-center mt-2">
        <PrimaryButton type="primary" :icon="Plus" @click="openAddDialog">录入新案件</PrimaryButton>
        <div class="flex gap-2">
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="primary" @click="loadCases">查询</el-button>
        </div>
      </div>
    </div>

    <div class="app-card p-6">
      <div class="flex justify-between items-center mb-4">
        <div class="card-title !mb-0">案件列表（共 {{ cases.length }} 件）</div>
      </div>
      <el-table :data="cases" stripe class="w-full" @row-click="openDetail" v-loading="loading">
        <el-table-column prop="case_no" label="案件编号" width="180" />
        <el-table-column prop="suspect_name" label="主要嫌疑人" width="140" />
        <el-table-column prop="brand" label="涉案品牌" width="160" />
        <el-table-column label="涉案金额" width="120" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-red-600">{{ row.amount }}元</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="130">
          <template #default="{ row }">
            <el-button link type="primary" class="!text-[#1A3A5C] !font-semibold" @click.stop="openDetail(row)">
              查看详情 →
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogOpen" :title="'案件详情 — ' + (currentCase?.case_no ?? '')" width="900px" :append-to-body="true">
      <template #header>
        <span class="text-base font-semibold">案件详情 — {{ currentCase?.case_no }}</span>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button :icon="Edit" @click="openEditDialog">修改</el-button>
          <el-button :icon="Delete" type="danger" @click="deleteCase">删除</el-button>
          <el-button @click="dialogOpen = false">关闭</el-button>
        </div>
      </template>
      <div v-if="currentCase" v-loading="detailLoading">
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div class="p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p class="text-xs font-semibold mb-2 text-gray-500">嫌疑人信息</p>
            <p class="font-bold text-lg text-[#1A3A5C]">{{ currentCase.suspect_name }}</p>
            <p class="text-sm mt-1 text-gray-600">涉案产品：{{ currentCase.brand }}</p>
          </div>
          <div class="p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p class="text-xs font-semibold mb-2 text-gray-500">案件概览</p>
            <div class="grid grid-cols-1 gap-2">
              <div>
                <p class="text-xl font-bold text-red-600">{{ currentCase.amount }}</p>
                <p class="text-xs text-gray-500">涉案金额(元)</p>
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
          <div v-if="detailData?.communications && detailData.communications.length > 0">
            <div
              v-for="(comm, index) in detailData.communications"
              :key="index"
              class="rounded-lg p-4 text-sm bg-gray-50 border border-gray-200 font-mono leading-relaxed mb-2"
            >
              <p>{{ comm.content }}</p>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-400">
            暂无聊天记录
          </div>
        </div>

        <div v-if="detailTab === 'trade'">
          <el-table :data="detailData?.transactions || []" stripe size="small">
            <el-table-column prop="transaction_time" label="日期" width="120" />
            <el-table-column prop="payer" label="付款方" width="140" />
            <el-table-column prop="payee" label="收款方" width="140" />
            <el-table-column label="金额" width="110" align="right">
              <template #default="scope">
                <span class="text-red-600 font-semibold">{{ scope.row.amount }}元</span>
              </template>
            </el-table-column>
            <el-table-column prop="payment_method" label="支付方式" width="120" />
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

    <!-- 新增案件弹窗 -->
    <el-dialog v-model="addDialogOpen" title="录入新案件" width="500px" :append-to-body="true">
      <el-form :model="addCaseForm" :rules="addCaseRules" label-width="100px">
        <el-form-item label="案件编号" prop="case_no">
          <el-input v-model="addCaseForm.case_no" placeholder="如：CASE001" />
        </el-form-item>
        <el-form-item label="嫌疑人姓名" prop="suspect_name">
          <el-input v-model="addCaseForm.suspect_name" placeholder="请输入嫌疑人姓名" />
        </el-form-item>
        <el-form-item label="涉案品牌" prop="brand">
          <el-input v-model="addCaseForm.brand" placeholder="请输入涉案品牌" />
        </el-form-item>
        <el-form-item label="涉案金额" prop="amount">
          <el-input v-model.number="addCaseForm.amount" placeholder="请输入涉案金额" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="addDialogOpen = false">取消</el-button>
          <el-button type="primary" @click="submitAddCase">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改案件弹窗 -->
    <el-dialog v-model="editDialogOpen" title="修改案件信息" width="500px" :append-to-body="true">
      <el-form :model="editCaseForm" :rules="editCaseRules" label-width="100px">
        <el-form-item label="嫌疑人姓名" prop="suspect_name">
          <el-input v-model="editCaseForm.suspect_name" placeholder="请输入嫌疑人姓名" />
        </el-form-item>
        <el-form-item label="涉案品牌" prop="brand">
          <el-input v-model="editCaseForm.brand" placeholder="请输入涉案品牌" />
        </el-form-item>
        <el-form-item label="涉案金额" prop="amount">
          <el-input v-model.number="editCaseForm.amount" placeholder="请输入涉案金额" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="editDialogOpen = false">取消</el-button>
          <el-button type="primary" @click="submitEditCase">提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>