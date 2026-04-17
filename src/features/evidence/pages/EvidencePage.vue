<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElInput, ElTable, ElTableColumn, ElMessage, ElProgress, ElAlert, ElSelect, ElOption, ElLoading } from "element-plus";
import { Cpu, Document, Connection, Upload, Money, Van } from "@element-plus/icons-vue";
import { useEvidenceStore } from "@/shared/stores/evidenceStore";
import { repositories } from "@/services";

const route = useRoute();
const router = useRouter();
const store = useEvidenceStore();

const evidenceTab = ref<"chat" | "transfer" | "logistics">('chat');
const selectedCaseId = ref("");
const evidenceType = ref('communication');

// 监听路由变化，自动切换 tab
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/evidence/chat")) {
      evidenceTab.value = "chat";
      evidenceType.value = 'communication';
    } else if (newPath.includes("/evidence/transfer")) {
      evidenceTab.value = "transfer";
      evidenceType.value = 'transaction';
    } else if (newPath.includes("/evidence/logistics")) {
      evidenceTab.value = "logistics";
      evidenceType.value = 'logistics';
    }
  },
  { immediate: true }
);

const caseOptions = ref<any[]>([]);

// 加载案件列表
async function loadCases() {
  try {
    const response = await repositories.cases.listCases({
      limit: 100,
      offset: 0,
    });
    if (response.code === 0) {
      caseOptions.value = response.data!.list.map(c => ({
        value: c.id,
        label: `${c.id} - ${c.suspect_name}`
      }));
    }
  } catch (error) {
    console.error('加载案件列表失败:', error);
  }
}

// 组件挂载时加载案件列表
onMounted(() => {
  loadCases();
});

const sampleChat = `刘某某: 老曹，刚到一批轮毂。
刘某某: 有奥迪A4L那款吗？
曹某某: 有，280一个。
刘某某: 市面上正品要600多。
刘某某: 这批货你别声张，不是原厂的，老规矩。
曹某某: 行，先来50个。
刘某某: 钱打农行卡，户名刘某某，尾号4589。`;

function loadSample() {
  store.rawText = sampleChat;
  store.reset();
  store.resetUpload();
}

function clearChatInput() {
  store.rawText = "";
  store.reset();
  store.resetUpload();
}

const isAnalyzing = ref(false);
const analysisDone = ref(false);
const analysisResult = ref<any>(null);
const analysisError = ref<string | null>(null);

const isTransferAnalyzing = ref(false);
const transferAnalysisDone = ref(false);
const transferResult = ref<any>(null);

const isLogisticsAnalyzing = ref(false);
const logisticsAnalysisDone = ref(false);
const logisticsResult = ref<any>(null);

const isUploading = computed(() => store.upload.status === "uploading");
const uploadDone = computed(() => store.upload.status === "success");
const uploadError = computed(() => store.upload.status === "error");
const uploadProgress = computed(() => store.upload.progress);
const uploadedFileName = computed(() => store.upload.fileName);
const uploadedRawText = computed(() => store.upload.rawText);

// 智能分析接口调用
async function startAnalysis() {
  if (!store.rawText.trim()) {
    ElMessage.warning("请先粘贴聊天记录或上传 CSV 文件");
    return;
  }
  
  isAnalyzing.value = true;
  analysisError.value = null;
  
  const loading = ElLoading.service({ fullscreen: true, text: '正在分析证据...' });
  
  try {
    const response = await fetch('http://localhost:8000/api/analyze/evidence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evidence_text: store.rawText,
        evidence_type: evidenceType.value
      }),
    });
    
    if (!response.ok) {
      throw new Error('分析失败');
    }
    
    const data = await response.json();
    analysisResult.value = data;
    analysisDone.value = true;
    
    ElMessage.success('分析完成');
  } catch (error) {
    analysisError.value = '分析失败，请稍后重试';
    console.error('分析失败:', error);
    ElMessage.error('分析失败，请稍后重试');
  } finally {
    isAnalyzing.value = false;
    loading.close();
  }
}

function scrollToEvidence(evidenceId: string) {
  const el = document.querySelector<HTMLElement>(`[data-evidence-id="${evidenceId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("evidence-highlight");
  setTimeout(() => el.classList.remove("evidence-highlight"), 2000);
}

function gotoRelations() {
  router.push("/relations");
}

const transferInput = ref("");
const logisticsInput = ref("");

function loadTransferSample() {
  transferInput.value = sampleTransfer;
  store.resetTransfer();
  store.resetUpload();
}

function clearTransferInput() {
  transferInput.value = "";
  store.resetTransfer();
  store.resetUpload();
}

async function startTransferAnalysis() {
  if (!transferInput.value.trim()) {
    ElMessage.warning("请先粘贴转账记录或上传 CSV 文件");
    return;
  }
  
  isTransferAnalyzing.value = true;
  
  try {
    // 解析输入的转账记录
    const records = transferInput.value.trim().split('\n').map(line => {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 4) {
        return {
          payer: parts[0],
          payee: parts[1],
          amount: parseFloat(parts[2]) || 0,
          time: parts[3],
          channel: parts[4] || '',
          caseId: selectedCaseId.value
        };
      }
      return null;
    }).filter((record): record is any => record !== null);
    
    if (records.length === 0) {
      ElMessage.warning("请输入有效的转账记录");
      return;
    }
    
    const response = await repositories.evidence.analyzeTransfer({ records });
    
    if (response.code === 0) {
      // 标准格式的情况
      transferResult.value = response.data;
      transferAnalysisDone.value = true;
    } else if (response) {
      // 直接返回数据的情况
      transferResult.value = response;
      transferAnalysisDone.value = true;
    } else {
      throw new Error('分析失败');
    }
    
    ElMessage.success('分析完成');
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试');
    console.error('分析失败:', error);
  } finally {
    isTransferAnalyzing.value = false;
  }
}

const sampleTransfer = `曹某某 | 刘某某 | 20200 | 2024-03-10 14:32 | 银行转账
曹某某 | 经销商A | 14000 | 2024-03-10 16:45 | 微信转账
刘某某 | 曹某某 | 15200 | 2024-03-08 09:15 | 支付宝转账
曹某某 | 买家乙 | 8400 | 2024-03-12 11:20 | 微信转账`;

function loadLogisticsSample() {
  logisticsInput.value = sampleLogistics;
  store.resetLogistics();
  store.resetUpload();
}

function clearLogisticsInput() {
  logisticsInput.value = "";
  store.resetLogistics();
  store.resetUpload();
}

async function startLogisticsAnalysis() {
  if (!logisticsInput.value.trim()) {
    ElMessage.warning("请先粘贴物流记录或上传 CSV 文件");
    return;
  }
  
  isLogisticsAnalyzing.value = true;
  
  try {
    // 解析输入的物流记录
    const records = logisticsInput.value.trim().split('\n').map(line => {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 4) {
        return {
          expressNo: parts[0],
          sender: parts[1],
          receiver: parts[2],
          time: parts[3],
          channel: parts[4] || '',
          caseId: selectedCaseId.value
        };
      }
      return null;
    }).filter((record): record is any => record !== null);
    
    if (records.length === 0) {
      ElMessage.warning("请输入有效的物流记录");
      return;
    }
    
    const response = await repositories.evidence.analyzeLogistics({ records });
    
    if (response.code === 0) {
      // 标准格式的情况
      logisticsResult.value = response.data;
      logisticsAnalysisDone.value = true;
    } else if (response) {
      // 直接返回数据的情况
      logisticsResult.value = response;
      logisticsAnalysisDone.value = true;
    } else {
      throw new Error('分析失败');
    }
    
    ElMessage.success('分析完成');
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试');
    console.error('分析失败:', error);
  } finally {
    isLogisticsAnalyzing.value = false;
  }
}

const sampleLogistics = `SF1234567890 | 刘某某 | 曹某某 | 2024-03-10 14:32 | 顺丰速运
YT9876543210 | 经销商A | 买家乙 | 2024-03-12 09:15 | 圆通速递
ZTO2345678901 | 刘某某 | 曹某某 | 2024-03-14 16:20 | 中通速递`;

async function handleFileUpload(file: File, evidenceType: "chat" | "transfer" | "logistics") {
  store.resetUpload();
  
  const formData = new FormData();
  formData.append('file', file);
  if (selectedCaseId.value) {
    formData.append('case_id', selectedCaseId.value);
  }
  
  try {
    let uploadUrl = '';
    if (evidenceType === "chat") {
      uploadUrl = '/upload/communications';
    } else if (evidenceType === "transfer") {
      uploadUrl = '/upload/transactions';
    } else {
      uploadUrl = '/upload/logistics';
    }
    
    store.upload.status = 'uploading';
    store.upload.progress = 0;
    
    const response = await repositories.evidence.uploadFile(uploadUrl, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          store.upload.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      }
    });
    
    store.upload.status = 'success';
    store.upload.fileName = file.name;
    
    // 这里可以根据后端返回的数据进行处理
    // 假设后端返回了文件内容或处理结果
    if (response.code === 0) {
      // 标准格式的情况
      if (evidenceType === "chat") {
        // 通讯记录上传成功
        ElMessage.success(`通讯记录「${file.name}」上传成功`);
      } else if (evidenceType === "transfer") {
        // 资金流水上传成功
        ElMessage.success(`资金流水「${file.name}」上传成功`);
      } else {
        // 物流记录上传成功
        ElMessage.success(`物流记录「${file.name}」上传成功`);
      }
    } else if (response) {
      // 直接返回数据的情况
      ElMessage.success(`文件「${file.name}」上传成功`);
    } else {
      throw new Error('上传失败');
    }
  } catch (error) {
    store.upload.status = 'error';
    store.upload.error = '文件上传失败';
    ElMessage.error('文件上传失败，请稍后重试');
    console.error('文件上传失败:', error);
  }

  return false;
}

async function handleTransferUpload(file: File) {
  return handleFileUpload(file, "transfer");
}

async function handleLogisticsUpload(file: File) {
  return handleFileUpload(file, "logistics");
}

function syncToLedger() {
  ElMessage.success("已同步至数据台账");
  router.push("/ledger");
}

// 生成分析报告
async function generateReport() {
  const loading = ElLoading.service({ fullscreen: true, text: '正在生成报告...' });
  
  try {
    const response = await fetch('http://localhost:8000/api/report/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        case_id: selectedCaseId.value || 1
      }),
    });
    
    if (!response.ok) {
      throw new Error('报告生成失败');
    }
    
    const data = await response.json();
    ElMessage.success('报告生成成功');
    console.log('报告生成结果:', data);
  } catch (error) {
    ElMessage.error('报告生成失败，请稍后重试');
    console.error('报告生成失败:', error);
  } finally {
    loading.close();
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- ===== 聊天记录解析 ===== -->
    <div v-show="evidenceTab === 'chat'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-2">
          <div class="app-card p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm text-text-secondary">案件编号：</span>
              <el-select v-model="selectedCaseId" placeholder="选择案件" class="!w-[220px]" clearable>
                <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div class="flex justify-between items-center mb-3">
              <div class="card-title !mb-0">原始谈话记录导入</div>
              <div class="flex gap-2">
                <button
                  class="action-btn action-btn-primary"
                  @click="loadSample"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"/></svg>
                  载入示例
                </button>
                <button
                  class="action-btn action-btn-danger"
                  @click="clearChatInput"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M810 273.472H54.72c-9.6 0-17.216 7.616-17.216 17.216s7.616 17.216 17.216 17.216H810c9.6 0 17.216-7.616 17.216-17.216s-7.616-17.216-17.216-17.216zM195.072 376.32c-3.072 3.072-4.096 6.912-4.096 11.264 0 4.352 1.024 8.192 4.096 11.264l68.864 68.864 68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 512l68.864 68.864c3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096L243.2 523.136l-68.864 68.864c-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264L276.992 512l-68.864-68.864c-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264 3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096L316.8 500.288l68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 576 195.072 494.08z"/></svg>
                  清空
                </button>
              </div>
            </div>

            <div class="relative mt-4">
              <el-input
                v-model="store.rawText"
                type="textarea"
                :rows="12"
                placeholder="请粘贴 QQ / 微信 / 电商平台 聊天记录内容，或上传 CSV 文件..."
                style="font-family: monospace; font-size: 13px"
              />
              <div
                v-if="isAnalyzing"
                class="scan-overlay absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
              />
            </div>

            <div class="mt-4">
              <el-button
                class="w-full mb-2"
                :icon="Upload"
                size="small"
                style="color: #1A3A5C; border-color: #D0D5DD"
                :loading="isUploading"
              >
                <label class="cursor-pointer">
                  选择 CSV 文件
                  <input
                    type="file"
                    accept=".csv,.txt"
                    class="hidden"
                    :disabled="isUploading"
                    @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if(f) handleFileUpload(f, 'chat') }"
                  />
                </label>
              </el-button>
              <el-progress
                v-if="isUploading"
                :percentage="uploadProgress"
                :stroke-width="6"
                style="margin-bottom: 8px"
              />
              <div v-if="uploadDone && uploadedFileName" class="text-xs mb-2" style="color: #27AE60">
                ✓ 已上传：{{ uploadedFileName }}，共 {{ uploadedRawText?.split("\n").length ?? 0 }} 行
              </div>
              <div v-if="uploadError" class="text-xs mb-2" style="color: #C0392B">
                ✗ {{ store.upload.error }}
              </div>
            </div>

            <div v-if="analysisError" class="mt-2">
              <el-alert type="error" :title="analysisError" :closable="false" show-icon />
            </div>

            <el-button
              type="primary"
              class="w-full mt-4 h-12 text-base font-bold"
              style="background: #1A3A5C; border-color: #1A3A5C"
              :loading="isAnalyzing"
              @click="startAnalysis"
            >
              🚀 开始 AI 法律线索提取
            </el-button>

            <div v-if="analysisDone" class="flex gap-4 mt-4">
              <el-button
                type="primary"
                :icon="Document"
                class="flex-1 h-10 font-semibold"
                style="background: #1A3A5C; border-color: #1A3A5C"
                @click="generateReport"
              >
                生成初步分析报告
              </el-button>
              <el-button
                :icon="Connection"
                class="flex-1 h-10 font-semibold"
                style="color: #1A3A5C; border-color: #1A3A5C"
                @click="gotoRelations"
              >
                转入关联图谱分析
              </el-button>
            </div>
          </div>
        </div>

        <div class="col-span-3">
          <div
            v-if="!analysisDone"
            class="app-card h-full flex flex-col items-center justify-center"
            style="min-height: 500px"
          >
            <el-icon :size="64" style="color: #D0D5DD"><Cpu /></el-icon>
            <p class="mt-6 text-base" style="color: #aaa">等待数据导入，点击左侧「开始解析」</p>
            <p class="text-xs mt-2" style="color: #ccc">系统将自动识别：价格异常 / 主观明知 / 关键主体</p>
          </div>

          <div v-else class="space-y-4">
            <div
              class="app-card p-4"
              style="border: 1px solid #F5C6C2; background: #FDECEA"
            >
              <div class="font-semibold" style="color: #C0392B">
                🔴 检测到疑似侵权法律特征
              </div>
            </div>

            <!-- 价格异常判定 -->
            <div v-if="analysisResult?.price_analysis" class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🔴</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">
                  价格异常判定
                </h4>
              </div>
              <div class="p-3 rounded-lg text-sm" style="background: #FDECEA; border: 1px solid #F5C6C2">
                <p v-if="analysisResult.price_analysis.is_anomaly">
                  价格异常：低于正品 {{ Math.round((1 - analysisResult.price_analysis.price_ratio) * 100) }}%
                </p>
                <p v-else>
                  价格正常
                </p>
                <p class="mt-1" style="color: #888">
                  {{ analysisResult.price_analysis.suggestion }}
                </p>
              </div>
            </div>

            <!-- 主观明知证据 -->
            <div v-if="analysisResult?.subjective_knowledge" class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🔴</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">
                  主观明知证据
                </h4>
              </div>
              <div class="p-3 rounded-lg text-sm" style="background: #F5F8FA; border: 1px solid #D0D5DD">
                <p class="font-semibold mb-2">评分：{{ analysisResult.subjective_knowledge.score }}/10（{{ analysisResult.subjective_knowledge.level }}）</p>
                <p class="mb-2">命中关键词：{{ analysisResult.subjective_knowledge.hit_keywords.join(' / ') }}</p>
                <div v-if="analysisResult.subjective_knowledge.quotes && analysisResult.subjective_knowledge.quotes.length > 0" class="mt-2">
                  <p class="text-xs font-semibold mb-1">原文引用：</p>
                  <div class="space-y-2">
                    <div v-for="(quote, index) in analysisResult.subjective_knowledge.quotes" :key="index" class="p-2 rounded bg-white border border-gray-200 text-xs">
                      {{ quote }}
                    </div>
                  </div>
                </div>
                <div v-if="analysisResult.subjective_knowledge.category_counts" class="mt-2">
                  <p class="text-xs font-semibold mb-1">关键词分类：</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="(count, category) in analysisResult.subjective_knowledge.category_counts" :key="category" class="px-2 py-1 rounded text-xs bg-gray-100">
                      {{ category }}: {{ count }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 关键主体提取 -->
            <div v-if="analysisResult?.key_entities" class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🟡</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">关键主体提取</h4>
              </div>
              <div class="space-y-2">
                <div v-if="analysisResult.key_entities.names && analysisResult.key_entities.names.length > 0" class="p-3 rounded bg-gray-50">
                  <p class="text-xs font-semibold mb-1">人员：</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="name in analysisResult.key_entities.names" :key="name" class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {{ name }}
                    </span>
                  </div>
                </div>
                <div v-if="analysisResult.key_entities.roles && analysisResult.key_entities.roles.length > 0" class="p-3 rounded bg-gray-50">
                  <p class="text-xs font-semibold mb-1">角色：</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="role in analysisResult.key_entities.roles" :key="role" class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {{ role }}
                    </span>
                  </div>
                </div>
                <div v-if="analysisResult.key_entities.contacts && analysisResult.key_entities.contacts.length > 0" class="p-3 rounded bg-gray-50">
                  <p class="text-xs font-semibold mb-1">联系方式：</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="contact in analysisResult.key_entities.contacts" :key="contact" class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      {{ contact }}
                    </span>
                  </div>
                </div>
                <div v-if="analysisResult.key_entities.amounts && analysisResult.key_entities.amounts.length > 0" class="p-3 rounded bg-gray-50">
                  <p class="text-xs font-semibold mb-1">金额：</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="amount in analysisResult.key_entities.amounts" :key="amount" class="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      {{ amount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 涉嫌罪名 -->
            <div v-if="analysisResult?.crime_type" class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">⚖️</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">涉嫌罪名</h4>
              </div>
              <div class="p-3 rounded-lg text-sm" style="background: #EEF3F8; border: 1px solid #D0D5DD">
                <p class="font-semibold">{{ analysisResult.crime_type }}</p>
              </div>
            </div>

            <div v-if="analysisError" class="app-card p-4">
              <el-alert type="error" :title="analysisError" :closable="false" show-icon />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 资金流水解析 ===== -->
    <div v-show="evidenceTab === 'transfer'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-2">
          <div class="app-card p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm text-text-secondary">案件编号：</span>
              <el-select v-model="selectedCaseId" placeholder="选择案件" class="!w-[220px]" clearable>
                <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div class="flex justify-between items-center mb-3">
              <div class="card-title !mb-0">资金流水导入</div>
              <div class="flex gap-2">
                <button
                  class="action-btn action-btn-primary"
                  @click="loadTransferSample"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"/></svg>
                  载入示例
                </button>
                <button
                  class="action-btn action-btn-danger"
                  @click="clearTransferInput"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M810 273.472H54.72c-9.6 0-17.216 7.616-17.216 17.216s7.616 17.216 17.216 17.216H810c9.6 0 17.216-7.616 17.216-17.216s-7.616-17.216-17.216-17.216zM195.072 376.32c-3.072 3.072-4.096 6.912-4.096 11.264 0 4.352 1.024 8.192 4.096 11.264l68.864 68.864 68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 512l68.864 68.864c3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096L243.2 523.136l-68.864 68.864c-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264L276.992 512l-68.864-68.864c-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264 3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096L316.8 500.288l68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 576 195.072 494.08z"/></svg>
                  清空
                </button>
              </div>
            </div>

            <div class="relative">
              <el-input
                v-model="transferInput"
                type="textarea"
                :rows="10"
                placeholder="粘贴示例格式：&#10;付款方 | 收款方 | 金额 | 时间 | 渠道&#10;曹某某 | 刘某某 | 20200 | 2024-03-10 | 银行转账&#10;..."
                style="font-family: monospace; font-size: 13px; line-height: 1.8"
              />
              <div
                v-if="isTransferAnalyzing"
                class="absolute inset-0 rounded-lg overflow-hidden flex flex-col items-center justify-center"
                style="background: rgba(248, 250, 252, 0.95)"
              >
                <div class="text-center">
                  <p class="text-base font-semibold mb-3" style="color: #1A3A5C">💰 正在解析资金数据...</p>
                  <div class="w-48 h-2 rounded-full overflow-hidden mx-auto mb-2" style="background: #E2E8F0">
                    <div class="h-full rounded-full transition-all duration-300" style="background: linear-gradient(90deg, #1A3A5C, #F59E0B); width: 60%" />
                  </div>
                  <div class="text-xs space-y-1" style="color: #888">
                    <p>✓ 已识别转账记录</p>
                    <p>✓ 已匹配涉案人员</p>
                    <p>⏳ 正在校验账号一致性...</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <el-button
                class="w-full mb-2"
                :icon="Upload"
                size="small"
                style="color: #1A3A5C; border-color: #D0D5DD"
                :loading="isUploading"
              >
                <label class="cursor-pointer">
                  选择 CSV 文件
                  <input
                    type="file"
                    accept=".csv,.txt"
                    class="hidden"
                    :disabled="isUploading"
                    @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if(f) handleTransferUpload(f) }"
                  />
                </label>
              </el-button>
              <el-progress
                v-if="isUploading"
                :percentage="uploadProgress"
                :stroke-width="6"
                style="margin-bottom: 8px"
              />
              <div v-if="uploadDone && uploadedFileName" class="text-xs mb-2" style="color: #27AE60">
                ✓ 已上传：{{ uploadedFileName }}，共 {{ uploadedRawText?.split("\n").length ?? 0 }} 行
              </div>
              <div v-if="uploadError" class="text-xs mb-2" style="color: #C0392B">
                ✗ {{ store.upload.error }}
              </div>
            </div>

            <div v-if="store.transfer.status === 'error'" class="mt-2">
              <el-alert type="error" :title="store.transfer.error ?? undefined" :closable="false" show-icon />
            </div>

            <el-button
              type="primary"
              class="w-full mt-3 h-12 text-base font-bold"
              style="background: #1A3A5C; border-color: #1A3A5C"
              :loading="isTransferAnalyzing"
              @click="startTransferAnalysis"
            >
              🚀 开始解析
            </el-button>

            <div v-if="transferAnalysisDone" class="space-y-3 mt-4">
              <div class="flex gap-4">
                <el-button
                  type="primary"
                  :icon="Document"
                  class="flex-1 h-10 font-semibold"
                  style="background: #1A3A5C; border-color: #1A3A5C"
                  @click="syncToLedger"
                >
                  同步至证据清单
                </el-button>
                <el-button
                  :icon="Connection"
                  class="flex-1 h-10 font-semibold"
                  style="color: #1A3A5C; border-color: #1A3A5C"
                  @click="gotoRelations"
                >
                  转入关联图谱分析
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-3">
          <div
            v-if="!transferAnalysisDone"
            class="app-card h-full flex flex-col items-center justify-center"
            style="min-height: 400px"
          >
            <el-icon :size="64" style="color: #D0D5DD"><Money /></el-icon>
            <p class="mt-6 text-base" style="color: #aaa">等待资金流水导入</p>
            <p class="text-xs mt-2" style="color: #ccc">上传 CSV 或粘贴记录后点击「开始解析」</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">💰 总涉案金额</p>
                <p class="text-3xl font-black" style="color: #F59E0B">¥{{ transferResult?.totalAmount.toLocaleString() }}</p>
                <p class="text-xs" style="color: #aaa">元</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">📊 交易笔数</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ transferResult?.transactionCount }}</p>
                <p class="text-xs" style="color: #aaa">笔</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">👥 涉案人员</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ transferResult?.personCount }}</p>
                <p class="text-xs" style="color: #aaa">人</p>
              </div>
            </div>

            <div class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🏆</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">高频交易对手 TOP{{ transferResult?.topCounterparties.length }}</h4>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(item, idx) in transferResult?.topCounterparties ?? []"
                  :key="idx"
                  class="flex items-center gap-3"
                >
                  <span
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : 'bg-amber-700 text-white'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-semibold text-sm" style="color: #1A3A5C">{{ item.name }}</span>
                  <div class="flex-1 h-2 rounded-full bg-gray-200">
                    <div
                      class="h-full rounded-full"
                      :class="idx === 0 ? 'bg-amber-500' : 'bg-[#1A3A5C]'"
                      :style="'width:' + item.percent + '%'"
                    />
                  </div>
                  <span class="text-sm font-bold" style="color: #F59E0B">¥{{ item.amount.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 物流记录解析 ===== -->
    <div v-show="evidenceTab === 'logistics'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-2">
          <div class="app-card p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm text-text-secondary">案件编号：</span>
              <el-select v-model="selectedCaseId" placeholder="选择案件" class="!w-[220px]" clearable>
                <el-option v-for="opt in caseOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div class="flex justify-between items-center mb-3">
              <div class="card-title !mb-0">物流记录导入</div>
              <div class="flex gap-2">
                <button
                  class="action-btn action-btn-primary"
                  @click="loadLogisticsSample"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"/></svg>
                  载入示例
                </button>
                <button
                  class="action-btn action-btn-danger"
                  @click="clearLogisticsInput"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024" fill="currentColor"><path d="M810 273.472H54.72c-9.6 0-17.216 7.616-17.216 17.216s7.616 17.216 17.216 17.216H810c9.6 0 17.216-7.616 17.216-17.216s-7.616-17.216-17.216-17.216zM195.072 376.32c-3.072 3.072-4.096 6.912-4.096 11.264 0 4.352 1.024 8.192 4.096 11.264l68.864 68.864 68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 512l68.864 68.864c3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096L243.2 523.136l-68.864 68.864c-3.072 3.072-6.912 4.096-11.264 4.096-4.352 0-8.192-1.024-11.264-4.096-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264L276.992 512l-68.864-68.864c-3.072-3.072-4.096-6.912-4.096-11.264 0-4.352 1.024-8.192 4.096-11.264 3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096L316.8 500.288l68.864-68.864c3.072-3.072 6.912-4.096 11.264-4.096 4.352 0 8.192 1.024 11.264 4.096 3.072 3.072 4.096 6.912 4.096 11.264 0 4.352-1.024 8.192-4.096 11.264L276.992 576 195.072 494.08z"/></svg>
                  清空
                </button>
              </div>
            </div>

            <div class="relative">
              <el-input
                v-model="logisticsInput"
                type="textarea"
                :rows="10"
                placeholder="粘贴示例格式：&#10;快递单号 | 发件人 | 收件人 | 时间 | 快递公司&#10;SF1234567890 | 刘某某 | 曹某某 | 2024-03-10 | 顺丰速运&#10;..."
                style="font-family: monospace; font-size: 13px; line-height: 1.8"
              />
              <div
                v-if="isLogisticsAnalyzing"
                class="absolute inset-0 rounded-lg overflow-hidden flex flex-col items-center justify-center"
                style="background: rgba(248, 250, 252, 0.95)"
              >
                <div class="text-center">
                  <p class="text-base font-semibold mb-3" style="color: #1A3A5C">🚚 正在解析物流数据...</p>
                  <div class="w-48 h-2 rounded-full overflow-hidden mx-auto mb-2" style="background: #E2E8F0">
                    <div class="h-full rounded-full transition-all duration-300" style="background: linear-gradient(90deg, #1A3A5C, #F59E0B); width: 60%" />
                  </div>
                  <div class="text-xs space-y-1" style="color: #888">
                    <p>✓ 已识别物流记录</p>
                    <p>✓ 已匹配收发件人</p>
                    <p>⏳ 正在分析物流轨迹...</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <el-button
                class="w-full mb-2"
                :icon="Upload"
                size="small"
                style="color: #1A3A5C; border-color: #D0D5DD"
                :loading="isUploading"
              >
                <label class="cursor-pointer">
                  选择 CSV 文件
                  <input
                    type="file"
                    accept=".csv,.txt"
                    class="hidden"
                    :disabled="isUploading"
                    @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if(f) handleLogisticsUpload(f) }"
                  />
                </label>
              </el-button>
              <el-progress
                v-if="isUploading"
                :percentage="uploadProgress"
                :stroke-width="6"
                style="margin-bottom: 8px"
              />
              <div v-if="uploadDone && uploadedFileName" class="text-xs mb-2" style="color: #27AE60">
                ✓ 已上传：{{ uploadedFileName }}，共 {{ uploadedRawText?.split("\n").length ?? 0 }} 行
              </div>
              <div v-if="uploadError" class="text-xs mb-2" style="color: #C0392B">
                ✗ {{ store.upload.error }}
              </div>
            </div>

            <el-button
              type="primary"
              class="w-full mt-3 h-12 text-base font-bold"
              style="background: #1A3A5C; border-color: #1A3A5C"
              :loading="isLogisticsAnalyzing"
              @click="startLogisticsAnalysis"
            >
              🚀 开始解析
            </el-button>

            <div v-if="logisticsAnalysisDone" class="space-y-3 mt-4">
              <div class="flex gap-4">
                <el-button
                  type="primary"
                  :icon="Document"
                  class="flex-1 h-10 font-semibold"
                  style="background: #1A3A5C; border-color: #1A3A5C"
                  @click="syncToLedger"
                >
                  同步至证据清单
                </el-button>
                <el-button
                  :icon="Connection"
                  class="flex-1 h-10 font-semibold"
                  style="color: #1A3A5C; border-color: #1A3A5C"
                  @click="gotoRelations"
                >
                  转入关联图谱分析
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-3">
          <div
            v-if="!logisticsAnalysisDone"
            class="app-card h-full flex flex-col items-center justify-center"
            style="min-height: 400px"
          >
            <el-icon :size="64" style="color: #D0D5DD"><Van /></el-icon>
            <p class="mt-6 text-base" style="color: #aaa">等待物流记录导入</p>
            <p class="text-xs mt-2" style="color: #ccc">上传 CSV 或粘贴记录后点击「开始解析」</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">📦 包裹总数</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ logisticsResult?.totalPackages }}</p>
                <p class="text-xs" style="color: #aaa">件</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">📤 发件人</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ logisticsResult?.senderCount }}</p>
                <p class="text-xs" style="color: #aaa">人</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">📥 收件人</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ logisticsResult?.receiverCount }}</p>
                <p class="text-xs" style="color: #aaa">人</p>
              </div>
            </div>

            <div class="app-card p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🏆</span>
                <h4 class="font-bold text-sm" style="color: #1A3A5C">高频发件人 TOP{{ logisticsResult?.topSenders.length }}</h4>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(item, idx) in logisticsResult?.topSenders ?? []"
                  :key="idx"
                  class="flex items-center gap-3"
                >
                  <span
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : 'bg-amber-700 text-white'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-semibold text-sm" style="color: #1A3A5C">{{ item.name }}</span>
                  <div class="flex-1 h-2 rounded-full bg-gray-200">
                    <div
                      class="h-full rounded-full"
                      :class="idx === 0 ? 'bg-amber-500' : 'bg-[#1A3A5C]'"
                      :style="'width:' + item.percent + '%'"
                    />
                  </div>
                  <span class="text-sm font-bold" style="color: #1A3A5C">{{ item.count }} 件</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>