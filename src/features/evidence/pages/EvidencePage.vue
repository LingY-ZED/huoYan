<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElInput, ElTable, ElTableColumn, ElMessage, ElProgress, ElAlert, ElSelect, ElOption } from "element-plus";
import { Cpu, Document, Connection, Upload, Money, Van } from "@element-plus/icons-vue";
import { useEvidenceStore } from "@/shared/stores/evidenceStore";
import { mockCaseList } from "@/mocks/cases";

const route = useRoute();
const router = useRouter();
const store = useEvidenceStore();

const evidenceTab = ref<"chat" | "transfer" | "logistics">("chat");
const selectedCaseId = ref("");

// 监听路由变化，自动切换 tab
watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/evidence/chat")) {
      evidenceTab.value = "chat";
    } else if (newPath.includes("/evidence/transfer")) {
      evidenceTab.value = "transfer";
    } else if (newPath.includes("/evidence/logistics")) {
      evidenceTab.value = "logistics";
    }
  },
  { immediate: true }
);

const caseOptions = computed(() => {
  return mockCaseList.data?.list.map(c => ({
    value: c.id,
    label: `${c.id} - ${c.suspect}`
  })) ?? [];
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

const isAnalyzing = computed(() => store.status === "scanning");
const analysisDone = computed(() => store.status === "success");
const result = computed(() => store.result);

const isTransferAnalyzing = computed(() => store.transfer.status === "analyzing");
const transferAnalysisDone = computed(() => store.transfer.status === "done");
const transferResult = computed(() => store.transfer.result);

const isLogisticsAnalyzing = computed(() => store.logistics.status === "analyzing");
const logisticsAnalysisDone = computed(() => store.logistics.status === "done");
const logisticsResult = computed(() => store.logistics.result);

const isUploading = computed(() => store.upload.status === "uploading");
const uploadDone = computed(() => store.upload.status === "success");
const uploadError = computed(() => store.upload.status === "error");
const uploadProgress = computed(() => store.upload.progress);
const uploadedFileName = computed(() => store.upload.fileName);
const uploadedRawText = computed(() => store.upload.rawText);

async function startAnalysis() {
  if (!store.rawText.trim()) {
    ElMessage.warning("请先粘贴聊天记录或上传 CSV 文件");
    return;
  }
  await store.analyze();
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
  await store.analyzeTransfer(transferInput.value);
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
  await store.analyzeLogistics(logisticsInput.value);
}

const sampleLogistics = `SF1234567890 | 刘某某 | 曹某某 | 2024-03-10 14:32 | 顺丰速运
YT9876543210 | 经销商A | 买家乙 | 2024-03-12 09:15 | 圆通速递
ZTO2345678901 | 刘某某 | 曹某某 | 2024-03-14 16:20 | 中通速递`;

async function handleFileUpload(file: File, evidenceType: "chat" | "transfer" | "logistics") {
  store.resetUpload();
  await store.uploadFile(file, evidenceType);

  if (store.upload.status === "success" && store.upload.rawText) {
    if (evidenceType === "chat") {
      store.rawText = store.upload.rawText;
      store.reset();
    } else if (evidenceType === "transfer") {
      transferInput.value = store.upload.rawText;
      store.resetTransfer();
    } else {
      logisticsInput.value = store.upload.rawText;
      store.resetLogistics();
    }
    ElMessage.success(`文件「${file.name}」上传成功，已识别 ${store.upload.rawText.split("\n").length} 行数据`);
  } else if (store.upload.status === "error") {
    ElMessage.error(store.upload.error || "文件上传失败");
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

            <div v-if="store.status === 'error'" class="mt-2">
              <el-alert type="error" :title="store.error ?? undefined" :closable="false" show-icon />
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
                :disabled="analysisDone"
                class="flex-1 h-10 font-semibold"
                style="background: #1A3A5C; border-color: #1A3A5C"
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
                🔴 检测到 {{ result?.evidenceCount ?? 0 }} 项高度疑似侵权法律特征
              </div>
            </div>

            <div
              v-for="conclusion in result?.conclusions ?? []"
              :key="conclusion.id"
              class="app-card p-5"
            >
              <template v-if="conclusion.type === 'price_anomaly'">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-lg">🔴</span>
                  <h4 class="font-bold text-sm" style="color: #1A3A5C">
                    价格异常判定（低于正品参考价 {{ conclusion.evidence.discountPercent }}%）
                  </h4>
                </div>
                <div class="p-3 rounded-lg text-sm" style="background: #FDECEA; border: 1px solid #F5C6C2">
                  <p>
                    {{ conclusion.evidence.product }}报价
                    <span class="price-highlight">{{ conclusion.evidence.quotedPrice }}元</span>
                    / 官方参考价：<b>{{ conclusion.evidence.referencePrice }}元</b>
                  </p>
                  <p class="mt-1" style="color: #888">
                    结论：符合典型非法牟利特征，低于正品价格 {{ conclusion.evidence.discountPercent }}%
                  </p>
                </div>
                <div class="mt-3 flex gap-2 flex-wrap">
                  <el-button
                    v-for="eid in conclusion.evidence.evidenceIds"
                    :key="eid"
                    size="small"
                    @click="scrollToEvidence(eid)"
                  >
                    命中：{{ conclusion.evidence.quotedPrice }}元
                  </el-button>
                </div>
              </template>

              <template v-else-if="conclusion.type === 'subjective_knowledge'">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-lg">🔴</span>
                  <h4 class="font-bold text-sm" style="color: #1A3A5C">
                    主观明知证据（回避性关键词）
                  </h4>
                </div>
                <div class="p-3 rounded-lg text-sm" style="background: #F5F8FA; border: 1px solid #D0D5DD">
                  <p class="italic" style="color: #555">
                    "{{ conclusion.evidence.rawQuote }}"
                  </p>
                  <p class="mt-1" style="color: #888">
                    命中关键词：{{ conclusion.evidence.keywords.join(" / ") }}
                  </p>
                </div>
                <div class="mt-3 flex gap-2 flex-wrap">
                  <el-button
                    v-for="pos in conclusion.evidence.keywordPositions"
                    :key="pos.evidenceId"
                    size="small"
                    @click="scrollToEvidence(pos.evidenceId)"
                  >
                    命中：{{ pos.word }}
                  </el-button>
                </div>
              </template>

              <template v-else-if="conclusion.type === 'key_entity'">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-lg">🟡</span>
                  <h4 class="font-bold text-sm" style="color: #1A3A5C">关键主体提取</h4>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="entity in conclusion.evidence.entities"
                    :key="entity.name"
                    class="flex items-center gap-3 p-2 rounded"
                    style="background: #EEF3F8"
                  >
                    <span class="font-bold text-sm" style="color: #1A3A5C">{{ entity.name }}</span>
                    <span class="tag-info">{{ entity.role }}</span>
                    <span v-if="entity.phone" class="text-xs" style="color: #888">手机：{{ entity.phone }}</span>
                    <span v-if="entity.bankAccount" class="text-xs" style="color: #888">{{ entity.bankAccount }}</span>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="store.status === 'error'" class="app-card p-4">
              <el-alert type="error" :title="store.error ?? undefined" :closable="false" show-icon />
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
                  :disabled="transferAnalysisDone"
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

            <div class="app-card p-5">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold text-sm" style="color: #1A3A5C">📋 交易明细表 <span class="text-xs font-normal" style="color: #888">（数据预览，请核对正确性）</span></h4>
                <el-button size="small" :icon="Document" style="color: #1A3A5C; border-color: #D0D5DD">
                  导出 CSV
                </el-button>
              </div>
              <el-table :data="transferResult?.records ?? []" stripe size="small" max-height="280">
                <el-table-column prop="payer" label="付款方" width="100" />
                <el-table-column prop="payee" label="收款方" width="100" />
                <el-table-column label="金额" width="100" align="right">
                  <template #default="scope">
                    <span class="font-bold" style="color: #F59E0B">¥{{ scope.row.amount.toLocaleString() }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="time" label="时间" width="130" />
                <el-table-column prop="channel" label="渠道" width="100">
                  <template #default="scope">
                    <span class="tag-info">{{ scope.row.channel }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="caseId" label="关联案件" width="140" />
              </el-table>
            </div>

            <div v-if="store.transfer.status === 'error'" class="app-card p-4">
              <el-alert type="error" :title="store.transfer.error ?? undefined" :closable="false" show-icon />
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
                placeholder="粘贴示例格式：&#10;快递单号 | 发件人 | 收件人 | 时间 | 渠道&#10;SF1234567890 | 刘某某 | 曹某某 | 2024-03-10 | 顺丰速运&#10;..."
                style="font-family: monospace; font-size: 13px; line-height: 1.8"
              />
              <div
                v-if="isLogisticsAnalyzing"
                class="absolute inset-0 rounded-lg overflow-hidden flex flex-col items-center justify-center"
                style="background: rgba(248, 250, 252, 0.95)"
              >
                <div class="text-center">
                  <p class="text-base font-semibold mb-3" style="color: #1A3A5C">📦 正在解析物流数据...</p>
                  <div class="w-48 h-2 rounded-full overflow-hidden mx-auto mb-2" style="background: #E2E8F0">
                    <div class="h-full rounded-full transition-all duration-300" style="background: linear-gradient(90deg, #1A3A5C, #27AE60); width: 70%" />
                  </div>
                  <div class="text-xs space-y-1" style="color: #888">
                    <p>✓ 已识别快递记录</p>
                    <p>✓ 已匹配收发件人信息</p>
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

            <div v-if="store.logistics.status === 'error'" class="mt-2">
              <el-alert type="error" :title="store.logistics.error ?? undefined" :closable="false" show-icon />
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
                  :disabled="logisticsAnalysisDone"
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
                <p class="text-xs font-semibold mb-1" style="color: #888">📦 总发货量</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ logisticsResult?.totalShipments }}</p>
                <p class="text-xs" style="color: #aaa">件</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">🚚 快递单数</p>
                <p class="text-3xl font-black" style="color: #27AE60">{{ logisticsResult?.expressCount }}</p>
                <p class="text-xs" style="color: #aaa">单</p>
              </div>
              <div class="app-card text-center p-4">
                <p class="text-xs font-semibold mb-1" style="color: #888">👥 涉案人员</p>
                <p class="text-3xl font-black" style="color: #1A3A5C">{{ logisticsResult?.personCount }}</p>
                <p class="text-xs" style="color: #aaa">人</p>
              </div>
            </div>

            <div
              v-if="(logisticsResult?.suspiciousShipments ?? []).length > 0"
              class="app-card p-5"
              style="border: 1px solid #F5C6C2; background: #FDECEA"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🚨</span>
                <h4 class="font-bold text-sm" style="color: #C0392B">
                  可疑物流 {{ logisticsResult?.suspiciousShipments.length }} 条
                </h4>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(ship, idx) in logisticsResult?.suspiciousShipments ?? []"
                  :key="idx"
                  class="p-3 rounded-lg text-sm"
                  style="background: white; border: 1px solid #F5C6C2"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-sm" style="color: #1A3A5C">{{ ship.expressNo }}</span>
                    <span class="tag-danger">{{ ship.channel }}</span>
                  </div>
                  <div class="text-xs" style="color: #555">
                    {{ ship.sender }} → {{ ship.receiver }} ｜ {{ ship.time }}
                  </div>
                  <div class="mt-1 text-xs" style="color: #C0392B">
                    ⚠️ {{ ship.reason }}
                  </div>
                </div>
              </div>
            </div>

            <div class="app-card p-5">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold text-sm" style="color: #1A3A5C">📋 物流明细表 <span class="text-xs font-normal" style="color: #888">（数据预览，请核对正确性）</span></h4>
                <el-button size="small" :icon="Document" style="color: #1A3A5C; border-color: #D0D5DD">
                  导出 CSV
                </el-button>
              </div>
              <el-table :data="logisticsResult?.records ?? []" stripe size="small" max-height="280">
                <el-table-column prop="expressNo" label="快递单号" width="150" />
                <el-table-column prop="sender" label="发件人" width="100" />
                <el-table-column prop="receiver" label="收件人" width="100" />
                <el-table-column prop="time" label="时间" width="130" />
                <el-table-column prop="channel" label="渠道" width="100">
                  <template #default="scope">
                    <span class="tag-info">{{ scope.row.channel }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default>
                    <span class="tag-info">正常</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-if="store.logistics.status === 'error'" class="app-card p-4">
              <el-alert type="error" :title="store.logistics.error ?? undefined" :closable="false" show-icon />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evidence-highlight {
  animation: evidence-flash 0.5s ease-in-out 0s 2;
}
@keyframes evidence-flash {
  0% { background: #fef2f2; }
  50% { background: #fecaca; }
  100% { background: #fef2f2; }
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.action-btn svg {
  flex-shrink: 0;
}
.action-btn-primary {
  background: #EEF3F8;
  color: #1A3A5C;
  border-color: #D0D5DD;
}
.action-btn-primary:hover {
  background: #1A3A5C;
  color: #ffffff;
  border-color: #1A3A5C;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 58, 92, 0.25);
}
.action-btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}
.action-btn-danger {
  background: #FEF2F2;
  color: #C0392B;
  border-color: #F5C6C2;
}
.action-btn-danger:hover {
  background: #C0392B;
  color: #ffffff;
  border-color: #C0392B;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(192, 57, 43, 0.25);
}
.action-btn-danger:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>
