<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { ElButton, ElInput, ElSelect } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { mockCrossCaseGraph, mockUpstreamGraphByCaseId } from "@/mocks/graphs";
import type { UpstreamGraph } from "@/entities/graph";
import { useRoute } from "vue-router";

const route = useRoute();

const graphTab = ref<"upstream" | "crosscase">("upstream");
const selectedCaseId = ref("2024-京二检-001");
const selectedNode = ref<any | null>(null);
const nodeSearch = ref("");
const crossRef = ref<HTMLDivElement | null>(null);
const upstreamRef = ref<HTMLDivElement | null>(null);
const crossChart = ref<ECharts | null>(null);
const upstreamChart = ref<ECharts | null>(null);

const crossGraph = mockCrossCaseGraph.data!;
const cases = [
  { id: "2024-京二检-001", suspect: "曹某某" },
  { id: "2024-京二检-002", suspect: "刘某某" },
  { id: "2024-京二检-003", suspect: "陈某强" },
  { id: "2024-京二检-004", suspect: "周某某" },
];

const upstreamDataMap: Record<string, UpstreamGraph> = mockUpstreamGraphByCaseId;
const currentUpstreamCase = computed(() => cases.find((c) => c.id === selectedCaseId.value));

const upstreamStats = computed(() => {
  const d = upstreamDataMap[selectedCaseId.value];
  if (!d) return { nodes: 0, links: 0, suppliers: 0, buyers: 0 };
  return {
    nodes: d.suppliers.length + 1 + d.buyers.length + d.middle.length,
    links: d.links.length,
    suppliers: d.suppliers.length,
    buyers: d.buyers.length,
  };
});

const upstreamSuppliers = computed(() => upstreamDataMap[selectedCaseId.value]?.suppliers ?? []);
const upstreamBuyers = computed(() => upstreamDataMap[selectedCaseId.value]?.buyers ?? []);

const graphStats = ref({ nodes: 7, links: 7, keyNodes: 3, linkedCases: 4 });

function truncateName(name: string) {
  return name.length > 5 ? name.substring(0, 5) + "…" : name;
}

function buildGraphOption(nodes: any[], links: any[]) {
  return {
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "rgba(26,58,92,0.95)",
      borderColor: "#1A3A5C",
      textStyle: { color: "#fff", fontSize: 12 },
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.3);",
    },
    series: [
      {
        type: "graph" as const,
        layout: "force" as const,
        roam: true,
        draggable: true,
        label: {
          show: true,
          fontSize: 11,
          color: "#fff",
          formatter: (p: any) => truncateName(p.data?.name ?? ""),
        },
        edgeLabel: {
          show: true,
          fontSize: 10,
          color: "#64748B",
          formatter: (p: any) => p.data?.label?.formatter ?? "",
        },
        force: {
          repulsion: 1800,
          edgeLength: [60, 150],
          gravity: 0.1,
          friction: 0.2,
        },
        emphasis: {
          focus: "adjacency" as const,
          itemStyle: {
            borderWidth: 3,
            borderColor: "#fff",
            shadowBlur: 12,
            shadowColor: "rgba(192,57,43,0.4)",
          },
          lineStyle: { width: 3, color: "#C0392B" },
        },
        data: nodes,
        links: links.map((l: any) => ({
          source: l.source,
          target: l.target,
          name: l.label?.formatter,
          label: l.label,
          lineStyle: { ...l.lineStyle, opacity: 0.8 },
        })),
      },
    ],
  };
}

function initGraph(
  chartRef: HTMLDivElement | null,
  existingChart: any,
  nodes: any[],
  links: any[],
  chartRefVar: "cross" | "upstream"
) {
  if (!chartRef) return;
  if (existingChart) {
    existingChart.dispose();
  }
  const instance = echarts.init(chartRef);
  if (chartRefVar === "cross") crossChart.value = instance;
  else upstreamChart.value = instance;

  instance.setOption(buildGraphOption(nodes, links));

  instance.on("click", (params: any) => {
    if (params.dataType === "node") {
      selectedNode.value = params.data;
    }
  });

  instance.on("graphRoam", () => {
    const opt: any = instance.getOption();
    const ns = opt.series[0].data as any[];
    const ls = opt.series[0].links as any[];
    ns.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined) {
        node.label ??= {};
        node.label.x = node.x;
        node.label.y = node.y;
      }
    });
    instance.setOption({ series: [{ data: ns, links: ls }] });
  });

  const resize = () => instance.resize();
  window.addEventListener("resize", resize);
}

function initCrossChart() {
  if (!crossRef.value) return;
  initGraph(crossRef.value, crossChart.value, crossGraph.nodes, crossGraph.links, "cross");
}

function initUpstreamChart() {
  if (!upstreamRef.value) return;
  const d = upstreamDataMap[selectedCaseId.value];
  if (!d) return;

  const allNodes = [
    ...d.suppliers.map((s) => ({ ...s })),
    { ...d.center },
    ...d.buyers.map((b) => ({ ...b })),
    ...d.middle.map((m) => ({ ...m })),
  ];

  if (selectedCaseId.value === "2024-京二检-001") {
    allNodes.push({ name: "农行***4589", role: "共用结算", itemStyle: { color: "#7C3AED" }, symbolSize: 42, symbol: "rect" });
  }

  initGraph(upstreamRef.value, upstreamChart.value, allNodes, d.links, "upstream");
}

function reloadUpstream() {
  nextTick(() => initUpstreamChart());
}

function highlightSearch() {
  if (!nodeSearch.value.trim() || !crossGraph) return;
  const found = crossGraph.nodes.find((n) => n.name.includes(nodeSearch.value.trim()));
  if (found) selectedNode.value = found;
}

function exportPng(which: "cross" | "upstream") {
  const chart = which === "cross" ? crossChart.value : upstreamChart.value;
  if (!chart) return;
  const url = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#E8EEF4" });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${which}-graph.png`;
  a.click();
}

watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/relations/upstream")) {
      graphTab.value = "upstream";
      nextTick(() => initUpstreamChart());
    } else if (newPath.includes("/relations/crosscase")) {
      graphTab.value = "crosscase";
      nextTick(() => initCrossChart());
    }
  },
  { immediate: true }
);

onMounted(() => {
  nextTick(() => initUpstreamChart());
});

onBeforeUnmount(() => {
  crossChart.value?.dispose();
  upstreamChart.value?.dispose();
});
</script>

<template>
  <div class="space-y-5">
    <!-- ===== 上下游关系图 ===== -->
    <div v-show="graphTab === 'upstream'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-3">
          <div class="app-card p-5">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-3">
                <span class="text-sm" style="color: #888">选择案件：</span>
                <el-select v-model="selectedCaseId" size="small" style="width: 200px" @change="reloadUpstream">
                  <el-option v-for="c in cases" :key="c.id" :label="c.id + ' — ' + c.suspect" :value="c.id" />
                </el-select>
                <el-button size="small" style="color: #1A3A5C; border-color: #D0D5DD" @click="reloadUpstream">
                  🔄 重置布局
                </el-button>
                <el-button size="small" type="primary" style="background: #1A3A5C; border-color: #1A3A5C" @click="exportPng('upstream')">
                  导出 PNG
                </el-button>
              </div>
            </div>
            <div class="graph-legend mb-3">
              <div class="legend-item"><div class="legend-dot" style="background: #1E293B"></div>上游供货商</div>
              <div class="legend-item"><div class="legend-dot" style="background: #C0392B"></div>核心嫌疑人</div>
              <div class="legend-item"><div class="legend-dot" style="background: #27AE60"></div>下游买家</div>
              <div class="legend-item"><div class="legend-dot" style="background: #E67E22"></div>中间商/仓储</div>
              <div class="legend-item"><div class="legend-dot" style="background: #7C3AED"></div>资金账户</div>
            </div>
            <div class="text-xs mb-2" style="color: #aaa">💡 拖动节点定位 | 滚轮缩放 | 鼠标悬停查看详情</div>
            <div ref="upstreamRef" style="width: 100%; height: 520px"></div>
          </div>
        </div>

        <div class="col-span-2">
          <div class="app-card p-5">
            <div class="card-title">产业链统计</div>
            <div
              v-if="currentUpstreamCase"
              class="p-4 rounded-lg mb-4"
              style="background: #FDECEA; border: 2px solid #F5C6C2"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-2xl font-extrabold" style="color: #C0392C">{{ currentUpstreamCase.suspect }}</p>
                  <p class="text-sm" style="color: #888">{{ currentUpstreamCase.id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-black" style="color: #C0392B">—</p>
                  <p class="text-xs" style="color: #888">涉案金额(万元)</p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <p class="text-xs font-bold mb-2" style="color: #888">⬆️ 上游供货商</p>
                <div class="space-y-2">
                  <div
                    v-for="s in upstreamSuppliers"
                    :key="s.name"
                    class="p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                    style="background: #EEF3F8; border: 1px solid #BDD0E6"
                    @click="selectedNode = s"
                  >
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" style="background: #1E293B"></div>
                        <span class="font-semibold text-sm" style="color: #1A3A5C">{{ s.name }}</span>
                      </div>
                      <span v-if="s.amount" class="text-sm font-bold" style="color: #888">{{ s.amount }}元</span>
                    </div>
                    <p class="text-xs mt-1" style="color: #aaa">{{ s.info }}</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-xs font-bold mb-2" style="color: #888">⬇️ 下游买家</p>
                <div class="space-y-2">
                  <div
                    v-for="b in upstreamBuyers"
                    :key="b.name"
                    class="p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                    style="background: #F0FAF0; border: 1px solid #A8D8A8"
                    @click="selectedNode = b"
                  >
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" style="background: #27AE60"></div>
                        <span class="font-semibold text-sm" style="color: #27AE60">{{ b.name }}</span>
                      </div>
                      <span v-if="b.amount" class="text-sm font-bold" style="color: #888">{{ b.amount }}元</span>
                    </div>
                    <p class="text-xs mt-1" style="color: #aaa">{{ b.info }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 pt-4" style="border-top: 1px solid #E8EEF4">
              <p class="text-xs font-bold mb-3" style="color: #888">图谱统计</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamStats.nodes }}</p>
                  <p class="text-xs" style="color: #888">节点数</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamStats.links }}</p>
                  <p class="text-xs" style="color: #888">关系链路</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #EEF3F8">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamStats.suppliers }}</p>
                  <p class="text-xs" style="color: #888">上游供应商</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #F0FAF0">
                  <p class="text-xl font-black" style="color: #27AE60">{{ upstreamStats.buyers }}</p>
                  <p class="text-xs" style="color: #888">下游买家</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 跨案关联拓扑 ===== -->
    <div v-show="graphTab === 'crosscase'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-3">
          <div class="app-card p-5">
            <div class="flex justify-between items-center mb-4">
              <div class="flex gap-2">
                <el-input v-model="nodeSearch" placeholder="搜索节点..." size="small" style="width: 150px" />
                <el-button size="small" style="color: #1A3A5C; border-color: #D0D5DD" @click="highlightSearch">节点检索</el-button>
                <el-button size="small" type="primary" style="background: #1A3A5C; border-color: #1A3A5C" @click="exportPng('cross')">导出 PNG</el-button>
              </div>
            </div>

            <div class="graph-legend mb-3">
              <div class="legend-item"><div class="legend-dot" style="background: #C0392B"></div>核心嫌疑人</div>
              <div class="legend-item"><div class="legend-dot" style="background: #1E293B"></div>上游供货商</div>
              <div class="legend-item"><div class="legend-dot" style="background: #27AE60"></div>下游买家</div>
              <div class="legend-item"><div class="legend-dot" style="background: #E67E22"></div>中间商</div>
              <div class="legend-item"><div class="legend-dot" style="background: #7C3AED"></div>资金账户</div>
            </div>
            <div class="text-xs mb-2" style="color: #aaa">💡 拖动节点定位 | 滚轮缩放 | 鼠标悬停查看详情</div>
            <div ref="crossRef" style="width: 100%; height: 560px"></div>
          </div>
        </div>

        <div class="col-span-2">
          <div class="app-card p-5">
            <div class="card-title">节点情报详情</div>

            <div v-if="!selectedNode" class="flex flex-col items-center justify-center py-24">
              <el-icon :size="48" style="color: #D0D5DD"><Search /></el-icon>
              <p class="mt-4 text-sm" style="color: #aaa">👆 请点击图谱中的节点</p>
              <p class="text-xs mt-1" style="color: #ccc">查看该人员的详细情报</p>
            </div>

            <div v-else>
              <div class="p-4 rounded-lg mb-4" style="background: #FDECEA; border: 2px solid #F5C6C2">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-2xl font-extrabold" style="color: #C0392C">{{ selectedNode.name }}</p>
                    <p class="text-sm mt-1" style="color: #888">{{ selectedNode.role }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-black" style="color: #C0392B">{{ selectedNode.count ?? 0 }}</p>
                    <p class="text-xs" style="color: #888">条线索</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <div class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">身份角色</span>
                  <span class="tag-info">{{ selectedNode.role }}</span>
                </div>
                <div class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">涉案金额</span>
                  <span class="font-bold" style="color: #C0392B">{{ (selectedNode.amount ?? 0).toLocaleString() }}元</span>
                </div>
                <div class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">所在案件</span>
                  <span class="text-sm">{{ selectedNode.caseId ?? "—" }}</span>
                </div>
                <div class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">联系电话</span>
                  <span class="text-sm font-mono" style="color: #555">{{ selectedNode.phone ?? "—" }}</span>
                </div>
                <div class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">关联人员</span>
                  <span class="text-sm">{{ selectedNode.linkedPersons ?? "—" }}</span>
                </div>
              </div>

              <div v-if="selectedNode.info" class="mt-4 p-3 rounded-lg text-sm" style="background: #F5F8FA; border: 1px solid #E8EEF4">
                <p class="font-semibold mb-1" style="color: #1A3A5C">详细情报</p>
                <p style="color: #555; line-height: 1.7">{{ selectedNode.info }}</p>
              </div>

              <div class="mt-3 flex gap-2 flex-wrap">
                <span class="tag-danger">⚠ 价格异常</span>
                <span v-if="(selectedNode.count ?? 0) > 10" class="tag-warning">高频交易</span>
                <span class="tag-purple">跨案关联</span>
              </div>

              <div class="mt-4 flex gap-2">
                <el-button size="small" type="primary" style="background: #1A3A5C; border-color: #1A3A5C; width: 100%">
                  查看完整证据链
                </el-button>
              </div>
            </div>

            <div class="mt-6 pt-4" style="border-top: 1px solid #E8EEF4">
              <p class="text-xs font-bold mb-3" style="color: #888">图谱统计</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ graphStats.nodes }}</p>
                  <p class="text-xs" style="color: #888">节点总数</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ graphStats.links }}</p>
                  <p class="text-xs" style="color: #888">关系链路</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #FDECEA">
                  <p class="text-xl font-black" style="color: #C0392B">{{ graphStats.keyNodes }}</p>
                  <p class="text-xs" style="color: #888">关键节点</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #F3F0FB">
                  <p class="text-xl font-black" style="color: #7C3AED">{{ graphStats.linkedCases }}</p>
                  <p class="text-xs" style="color: #888">涉案案件</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
