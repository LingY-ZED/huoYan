<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { ElButton, ElInput, ElSelect, ElMessage, ElLoading } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { repositories } from "@/services";
import type { UpstreamGraph, CrossCaseGraph } from "@/entities/graph";
import { useRoute } from "vue-router";
import { maskPhone, maskName } from "@/utils/masking";

const route = useRoute();

const graphTab = ref<"upstream" | "crosscase">("upstream");
const selectedCaseId = ref("");
const selectedNode = ref<any | null>(null);
const nodeSearch = ref("");
const crossRef = ref<HTMLDivElement | null>(null);
const upstreamRef = ref<HTMLDivElement | null>(null);
const crossChart = ref<ECharts | null>(null);
const upstreamChart = ref<ECharts | null>(null);
const resizeHandlers = new Set<() => void>();

const crossGraph = ref<CrossCaseGraph | null>(null);
const upstreamData = ref<UpstreamGraph | null>(null);
const cases = ref<any[]>([]);
const personLedger = ref<any[]>([]);
const recidivismData = ref<any>(null);
const detailedUpstream = ref<any[]>([]);
const detailedDownstream = ref<any[]>([]);
const detailedCoreSuspects = ref<any[]>([]);
const totalAmount = ref(0);
const illegalIncome = ref(0);
const totalTransactions = ref(0);
const hiddenSources = ref(0);
const coreCount = ref(0);
const upstreamCount = ref(0);
const downstreamCount = ref(0);
const loading = ref(false);
const selectedCaseChain = ref<any>(null);
const currentUpstreamCase = computed(() => cases.value.find((c) => c.id === selectedCaseId.value));

const upstreamStats = computed(() => {
  const d = upstreamData.value;
  if (!d) return { nodes: 0, links: 0, suppliers: 0, buyers: 0 };
  
  // 统计图中实际存在的唯一节点
  const uniqueNodes = new Set();
  if (d.center) uniqueNodes.add(d.center.id || d.center.name);
  d.suppliers.forEach(n => uniqueNodes.add(n.id || n.name));
  d.buyers.forEach(n => uniqueNodes.add(n.id || n.name));
  d.middle.forEach(n => uniqueNodes.add(n.id || n.name));

  return {
    nodes: uniqueNodes.size,
    links: d.links.length,
    suppliers: detailedUpstream.value.length,
    buyers: detailedDownstream.value.length,
  };
});

const upstreamSuppliers = computed(() => detailedUpstream.value);
const upstreamBuyers = computed(() => detailedDownstream.value);

const graphStats = ref({ nodes: 0, links: 0, keyNodes: 0, linkedCases: 0 });

// 加载案件列表
async function loadCases() {
  try {
    const response = await repositories.cases.listCases({
      limit: 100,
      offset: 0,
    });
    const list = Array.isArray(response) ? response : ((response as any)?.list || (response as any)?.data?.list || []);
    
    cases.value = list.map((c: any) => ({
      id: isNaN(Number(c.id)) ? c.id : Number(c.id),
      case_no: c.case_no,
      suspect: c.suspect_name || '未知嫌疑人'
    }));
    
    const queryCaseId = route.query.caseId as string;
    if (queryCaseId) {
      const numId = Number(queryCaseId);
      selectedCaseId.value = isNaN(numId) ? queryCaseId : numId;
    } else if (cases.value.length > 0 && !selectedCaseId.value) {
      selectedCaseId.value = cases.value[0].id;
    }

    if (selectedCaseId.value && graphTab.value === "upstream") {
      reloadUpstream();
    }
  } catch (error) {
    console.error('加载案件列表失败:', error);
  }
}

// 加载跨案关联数据
async function loadCrossCaseGraph() {
  loading.value = true;
  try {
    const response = await repositories.relations.getCrossCaseGraph();
    // 后端返回的是 List[Dict] 结构，每个 dict 包含 person, case_ids, case_details
    const connections = Array.isArray(response) ? response : (response.data || []);
    
    if (connections.length === 0) {
      crossGraph.value = { nodes: [], links: [] };
      graphStats.value = { nodes: 0, links: 0, keyNodes: 0, linkedCases: 0 };
      return;
    }

    const nodesMap = new Map();
    const links: any[] = [];
    const caseIdsSet = new Set<number>();

    connections.forEach((conn: any) => {
      // 1. 添加人员节点
      const personId = `person_${conn.person}`;
      if (!nodesMap.has(personId)) {
        nodesMap.set(personId, {
          id: personId,
          name: conn.person,
          category: '人员',
          symbolSize: 40 + (conn.case_count * 10), // 案件越多，节点越大
          role: conn.role || '', // 优先取后端传来的角色，没有则置空
          itemStyle: { color: '#C0392B' },
          count: conn.case_count
        });
      }

      // 2. 处理关联案件
      conn.case_ids.forEach((caseId: number, idx: number) => {
        caseIdsSet.add(caseId);
        const caseDetail = conn.case_details?.[idx];
        const caseNodeId = `case_${caseId}`;
        
        if (!nodesMap.has(caseNodeId)) {
          nodesMap.set(caseNodeId, {
            id: caseNodeId,
            name: caseDetail?.case_no || `案件${caseId}`,
            category: '关联案件',
            symbolSize: 50, // 增大案件节点，以便包裹文字
            itemStyle: { color: '#1A3A5C' },
            isCase: true,
            count: 0,
            info: caseDetail?.brand ? `涉及品牌: ${caseDetail.brand}` : ''
          });
        }
        
        // 增加关联人数统计
        const cNode = nodesMap.get(caseNodeId);
        if (cNode) cNode.count++;

        // 3. 建立连线 (人员 -> 案件)
        links.push({
          source: personId,
          target: caseNodeId,
          label: { show: true, formatter: "涉案" },
          lineStyle: { width: 1.5, curveness: 0.1, color: '#CBD5E1' }
        });
      });
    });

    crossGraph.value = {
      nodes: Array.from(nodesMap.values()),
      links: links
    };

    graphStats.value = {
      nodes: crossGraph.value.nodes.length,
      links: crossGraph.value.links.length,
      keyNodes: connections.length,
      linkedCases: caseIdsSet.size
    };

    nextTick(() => {
      initCrossChart();
    });
  } catch (error) {
    ElMessage.error("获取跨案关联数据失败，请稍后重试");
    console.error("获取跨案关联数据失败:", error);
  } finally {
    loading.value = false;
  }
}

async function loadPersonLedger() {
  try {
    const response = await repositories.relations.getPersonLedger();
    const list = Array.isArray(response) ? response : (response as any)?.data || [];
    personLedger.value = list;
  } catch (error) {
    console.error('加载人员台账数据失败:', error);
  }
}

watch(selectedNode, async (node) => {
  if (node && node.name) {
    if (node.isCase) {
      // 案件节点：加载上下游关系
      const caseId = node.id.replace('case_', '');
      try {
        const response = await repositories.relations.getUpstreamGraph({ caseId });
        selectedCaseChain.value = response.data || response;
      } catch (error) {
        console.error("加载案件上下游关系失败:", error);
        selectedCaseChain.value = null;
      }
      recidivismData.value = null;
    } else {
      // 人员节点：加载累犯情报
      try {
        const response = await repositories.relations.getRecidivism(node.name);
        recidivismData.value = (response as any).data || response;
      } catch (error) {
        console.error("加载累犯情报失败:", error);
        recidivismData.value = null;
      }
      selectedCaseChain.value = null;
    }
  } else {
    recidivismData.value = null;
    selectedCaseChain.value = null;
  }
});

const selectedNodeDetail = computed(() => {
  if (!selectedNode.value) return null;
  const evidenceSource = [
    ...detailedUpstream.value, 
    ...detailedDownstream.value, 
    ...detailedCoreSuspects.value
  ].find(p => p.name === selectedNode.value.name);
    
  const fromLedger = personLedger.value.find(p => p.name === selectedNode.value.name);
  return {
    ...selectedNode.value,
    phone: fromLedger?.phone || selectedNode.value.phone,
    count: fromLedger?.linked_cases || selectedNode.value.count || 0,
    amount: fromLedger?.illegal_business_amount || evidenceSource?.total_out_amount || evidenceSource?.amount || selectedNode.value.amount || 0,
    info: fromLedger?.info || selectedNode.value.info,
    isRecidivist: recidivismData.value?.is_recidivist,
    previousCases: recidivismData.value?.previous_cases || [],
    relatedCasesDetail: recidivismData.value?.related_cases || [],
    suggestion: recidivismData.value?.suggestion,
    // 证据链数据
    evidence: evidenceSource?.evidence || null,
    crimeType: evidenceSource?.crime_type || selectedNode.value.crime_type,
    behaviorRole: evidenceSource?.behavior_role || selectedNode.value.behavior_role,
    keywordRoles: evidenceSource?.keyword_roles || [],
    // 金融与通讯数据 (优先取自 graph 节点，这些是 verified backend fields)
    moneyIn: selectedNode.value.money_in,
    moneyOut: selectedNode.value.money_out,
    commFrequency: selectedNode.value.comm_frequency,
    // 确保角色字段优先取更具体的，如果都没有则为 null
    role: fromLedger?.role || evidenceSource?.role || evidenceSource?.behavior_role || selectedNode.value.role || null
  };
});

// 加载上游关系数据
async function loadUpstreamGraph(caseId: string | number) {
  if (!caseId) return;
  loading.value = true;
  try {
    // 使用 Promise.allSettled 或单独处理以防部分接口未实现导致全屏报错
    const [rawRes, upListRes, downListRes, coreListRes] = await Promise.allSettled([
      repositories.relations.getUpstreamGraph({ caseId }),
      repositories.relations.getUpstreamList(caseId),
      repositories.relations.getDownstreamList(caseId),
      repositories.relations.getCoreSuspectsList(caseId)
    ]);
    
    const raw = rawRes.status === 'fulfilled' ? rawRes.value : null;
    const upList = upListRes.status === 'fulfilled' ? upListRes.value : [];
    const downList = downListRes.status === 'fulfilled' ? downListRes.value : [];
    const coreList = coreListRes.status === 'fulfilled' ? coreListRes.value : [];

    if (!raw) {
      throw new Error("关键图谱数据获取失败");
    }
    
    detailedUpstream.value = upList.data || upList || [];
    detailedDownstream.value = downList.data || downList || [];
    detailedCoreSuspects.value = coreList.data || coreList || [];
    
    console.log("Relations API Response:", raw); 
    
    // 兼容 {code, data} 和 直接返回数据 两种模式
    const resData = (raw.code === 0 && raw.data) ? raw.data : raw;
    
    // 更新统计摘要
    totalAmount.value = resData.statistics?.total_transaction_amount || resData.amount_summary?.total_transaction_amount || 0;
    illegalIncome.value = resData.amount_summary?.illegal_income || 0;
    totalTransactions.value = resData.statistics?.total_transaction_count || 0;
    hiddenSources.value = resData.statistics?.hidden_source_count || 0;
    
    upstreamCount.value = resData.upstream_count || 0;
    downstreamCount.value = resData.downstream_count || 0;
    coreCount.value = resData.core_count || 0;
    
    // 如果后端直接返回了 relation_graph 拓扑结构 (包含 nodes 和 edges)
    if (resData.relation_graph) {
      const nodes = (resData.relation_graph.nodes || []).map((n: any) => ({
        ...n,
        // 如果后端返回的是 id，确保 name 也有值用于显示
        name: n.name || n.label || n.id,
        symbolSize: (n.role || '').includes('核心') ? 70 : 55,
        itemStyle: { 
          color: (() => {
            const r = (n.role || n.name || '').toString();
            if (r.includes('核心') || r.includes('嫌疑')) return "#C0392B";
            if (r.includes('上游') || r.includes('供货') || r.includes('供应')) return "#1E293B";
            if (r.includes('下游') || r.includes('买家') || r.includes('销售') || r.includes('购货')) return "#27AE60";
            if (r.includes('资金') || r.includes('支付')) return "#7C3AED";
            if (r.includes('中间') || r.includes('仓储') || r.includes('转运')) return "#E67E22";
            return "#E67E22"; // 默认色
          })()
        }
      }));

      const links = (resData.relation_graph.edges || resData.relation_graph.links || []).map((e: any) => ({
        ...e,
        // 确保 source 和 target 存在
        source: e.source,
        target: e.target,
        label: e.label || { show: true, formatter: e.type || "关联" },
        lineStyle: { 
          color: e.type === '资金' ? '#F5C6C2' : (e.type === '供货' ? '#BDD0E6' : '#A8D8A8'),
          width: 2,
          type: e.type === '资金' ? 'dashed' : 'solid'
        }
      }));

      const centerNode = nodes.find((n: any) => (n.role || '').includes('核心')) || nodes[0];
      
      if (!centerNode) {
        upstreamData.value = null;
        return;
      }

      upstreamData.value = {
        caseId: caseId.toString(),
        center: centerNode,
        suppliers: nodes.filter((n: any) => {
          const r = (n.role || n.name || '').toLowerCase();
          return (r.includes('上游') || r.includes('供货') || r.includes('供应')) && n !== centerNode;
        }),
        buyers: nodes.filter((n: any) => {
          const r = (n.role || n.name || '').toLowerCase();
          return (r.includes('下游') || r.includes('买家') || r.includes('销售')) && n !== centerNode;
        }),
        middle: nodes.filter((n: any) => {
          const r = (n.role || n.name || '').toLowerCase();
          const isKnown = r.includes('核心') || r.includes('上游') || r.includes('供货') || r.includes('供应') || r.includes('下游') || r.includes('买家') || r.includes('销售');
          return !isKnown && n !== centerNode;
        }),
        links: links
      };
    } else {
      // 备选逻辑：如果后端只返回了 upstream/downstream/core_suspects 列表
      const suppliers = (resData.upstream || []).map((s: any) => ({
        name: s.name, role: s.role, amount: s.amount, info: `供货金额: ${s.amount || 0}元`,
        itemStyle: { color: "#1E293B" }, symbolSize: 55
      }));
      const buyers = (resData.downstream || []).map((b: any) => ({
        name: b.name, role: b.role, amount: b.amount, info: `购买金额: ${b.amount || 0}元`,
        itemStyle: { color: "#27AE60" }, symbolSize: 55
      }));
      const coreSuspects = (resData.core_suspects || []).map((c: any) => ({
        name: c.name, role: c.role, amount: c.amount,
        itemStyle: { color: "#C0392B" }, symbolSize: 70
      }));

      const currentCase = cases.value.find(c => c.id === caseId);
      const center = coreSuspects.length > 0 ? coreSuspects[0] : null;
      
      if (!center) {
        upstreamData.value = null;
        return;
      }
      const middle = coreSuspects.slice(1);

      const links: any[] = [];
      suppliers.forEach((s: any) => {
        links.push({ source: s.name, target: center.name, label: { show: true, formatter: "供货" }, lineStyle: { color: "#BDD0E6", width: 2 } });
      });
      buyers.forEach((b: any) => {
        links.push({ source: center.name, target: b.name, label: { show: true, formatter: "销售" }, lineStyle: { color: "#A8D8A8", width: 2 } });
      });
      middle.forEach((m: any) => {
        links.push({ source: m.name, target: center.name, label: { show: true, formatter: "资金" }, lineStyle: { color: "#F5C6C2", width: 2, type: 'dashed' } });
      });

      upstreamData.value = {
        caseId: caseId.toString(),
        center: center,
        suppliers: suppliers,
        buyers: buyers,
        middle: middle,
        links: links
      };
    }
  } catch (error) {
    ElMessage.error("获取上游关系数据失败，请稍后重试");
    console.error("获取上游关系数据失败:", error);
  } finally {
    loading.value = false;
  }
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
          fontSize: 10,
          color: "#fff",
          position: "inside",
          lineHeight: 12,
          align: "center",
          verticalAlign: "middle",
          formatter: (p: any) => {
             const name = p.data?.name ?? "";
             // 如果名字包含下划线或空格，尝试换行
             if (name.includes('_')) return name.replace('_', '\n');
             if (name.includes(' ')) return name.replace(' ', '\n');
             if (name.length <= 4) return name;
             return name.substring(0, 4) + "\n" + name.substring(4, 8) + (name.length > 8 ? ".." : "");
          },
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
  nodes: any[],
  links: any[],
  chartType: "cross" | "upstream"
) {
  if (!chartRef) return;
  
  let instance = chartType === "cross" ? crossChart.value : upstreamChart.value;
  
  if (!instance) {
    instance = echarts.init(chartRef);
    if (chartType === "cross") crossChart.value = instance;
    else upstreamChart.value = instance;

    // 仅在初始化时绑定事件
    instance.on("click", (params: any) => {
      if (params.dataType === "node") {
        selectedNode.value = params.data;
      }
    });

    instance.on("graphRoam", () => {
      const opt: any = instance?.getOption();
      if (!opt) return;
      const ns = opt.series[0].data as any[];
      const ls = opt.series[0].links as any[];
      ns.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          node.label ??= {};
          node.label.x = node.x;
          node.label.y = node.y;
        }
      });
      instance?.setOption({ series: [{ data: ns, links: ls }] });
    });

    const resize = () => {
      if (instance && !instance.isDisposed()) {
        instance.resize();
      }
    };
    window.addEventListener("resize", resize);
    resizeHandlers.add(resize);
  }

  // 使用 setOption 更新数据，而不是销毁重建
  instance.setOption(buildGraphOption(nodes, links));
}

function initCrossChart() {
  if (!crossRef.value || !crossGraph.value) return;
  initGraph(crossRef.value, crossGraph.value.nodes, crossGraph.value.links, "cross");
}

function initUpstreamChart() {
  if (!upstreamRef.value || !upstreamData.value) return;
  const d = upstreamData.value;

  // 核心：通过 Map 确保节点 ID/Name 绝对唯一，解决 ECharts "duplicate name or id" 报错
  const nodeMap = new Map();
  
  // 按照优先级加入：中心节点 > 供应商 > 买家 > 其他
  const addNode = (n: any) => {
    if (!n) return;
    const key = n.id || n.name;
    if (key && !nodeMap.has(key)) {
      nodeMap.set(key, { ...n });
    }
  };

  addNode(d.center);
  d.suppliers.forEach(addNode);
  d.buyers.forEach(addNode);
  d.middle.forEach(addNode);

  const allNodes = Array.from(nodeMap.values());
  initGraph(upstreamRef.value, allNodes, d.links, "upstream");
}

onBeforeUnmount(() => {
  resizeHandlers.forEach(handler => window.removeEventListener("resize", handler));
  resizeHandlers.clear();
  
  if (crossChart.value && !crossChart.value.isDisposed()) crossChart.value.dispose();
  if (upstreamChart.value && !upstreamChart.value.isDisposed()) upstreamChart.value.dispose();
});

async function reloadUpstream() {
  await loadUpstreamGraph(selectedCaseId.value);
}

function highlightSearch() {
  if (!nodeSearch.value.trim() || !crossGraph.value) return;
  const found = crossGraph.value.nodes.find((n) => n.name.includes(nodeSearch.value.trim()));
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

watch(upstreamData, (newData) => {
  if (newData && graphTab.value === "upstream") {
    nextTick(() => initUpstreamChart());
  }
});

watch(crossGraph, (newData) => {
  if (newData && graphTab.value === "crosscase") {
    nextTick(() => initCrossChart());
  }
});

watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes("/relations/upstream")) {
      graphTab.value = "upstream";
      loadUpstreamGraph(selectedCaseId.value);
    } else if (newPath.includes("/relations/crosscase")) {
      graphTab.value = "crosscase";
      loadCrossCaseGraph();
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadCases(); 
  loadPersonLedger();
  if (graphTab.value === "crosscase") {
    loadCrossCaseGraph();
  }
});

async function handleGlobalCaseChange() {
  if (graphTab.value === 'upstream') {
    reloadUpstream();
  } else {
    // 在跨案关联图中高亮该案件
    const caseNodeId = `case_${selectedCaseId.value}`;
    const found = crossGraph.value?.nodes.find(n => n.id === caseNodeId);
    if (found) {
      selectedNode.value = found;
      // 可以在此处增加 ECharts 实例的中心定位逻辑 (暂略)
    }
  }
}

function reloadCurrentGraph() {
  if (graphTab.value === 'upstream') reloadUpstream();
  else loadCrossCaseGraph();
}

onBeforeUnmount(() => {
  crossChart.value?.dispose();
  upstreamChart.value?.dispose();
});
</script>

<template>
  <div class="space-y-5">
    <!-- 全局头部：案件选择与操作 -->
    <div class="app-card p-5">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-gray-500">当前主战案件:</span>
            <el-select v-model="selectedCaseId" size="default" style="width: 280px" @change="handleGlobalCaseChange">
              <el-option v-for="c in cases" :key="c.id" :label="c.case_no + ' — ' + c.suspect" :value="c.id" />
            </el-select>
          </div>
          <div class="h-6 w-px bg-gray-200"></div>
          <div class="flex gap-2">
            <el-button size="small" :type="graphTab === 'upstream' ? 'primary' : ''" @click="graphTab = 'upstream'" :style="graphTab === 'upstream' ? 'background: #1A3A5C; border-color: #1A3A5C' : ''">单案全链穿透</el-button>
            <el-button size="small" :type="graphTab === 'crosscase' ? 'primary' : ''" @click="graphTab = 'crosscase'" :style="graphTab === 'crosscase' ? 'background: #1A3A5C; border-color: #1A3A5C' : ''">跨案碰撞关联</el-button>
          </div>
        </div>
        <div class="flex gap-2">
           <el-button size="small" style="color: #1A3A5C; border-color: #D0D5DD" @click="reloadCurrentGraph">
             🔄 刷新布局
           </el-button>
           <el-button size="small" type="primary" style="background: #1A3A5C; border-color: #1A3A5C" @click="exportPng(graphTab === 'crosscase' ? 'cross' : 'upstream')">
             导出可视化图
           </el-button>
        </div>
      </div>
    </div>

    <!-- ===== 上下游关系图 ===== -->
    <div v-show="graphTab === 'upstream'">
      <div class="grid grid-cols-5 gap-5">
        <div class="col-span-3">
          <div class="app-card p-5">
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
            <div class="card-title flex justify-between items-center">
              <span>{{ selectedNode ? '节点情报详情' : '产业链统计' }}</span>
              <el-button v-if="selectedNode" size="small" @click="selectedNode = null">返回统计</el-button>
            </div>

            <!-- 情报详情面板 -->
            <div v-if="selectedNodeDetail">
              <div class="p-4 rounded-lg mb-4" style="background: #FDECEA; border: 2px solid #F5C6C2">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-2xl font-extrabold" style="color: #C0392C">
                      {{ selectedNodeDetail.isCase ? selectedNodeDetail.name : maskName(selectedNodeDetail.name) }}
                    </p>
                    <p class="text-sm mt-1" style="color: #888">{{ selectedNodeDetail.role || (selectedNodeDetail.isCase ? '涉案案件' : '关联人员') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-black" style="color: #C0392B">{{ selectedNodeDetail.count }}</p>
                    <p class="text-xs" style="color: #888">{{ selectedNodeDetail.isCase ? '名关联人员' : '个关联案件' }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <div v-if="selectedNodeDetail.role" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">身份角色</span>
                  <span class="tag-info">{{ selectedNodeDetail.role }}</span>
                </div>
                <div v-if="selectedNodeDetail.crimeType" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">涉嫌罪名</span>
                  <span class="text-xs" style="color: #555">{{ selectedNodeDetail.crimeType }}</span>
                </div>
                <div v-if="selectedNodeDetail.keywordRoles?.length" class="mt-2 flex gap-1 flex-wrap">
                  <span v-for="r in selectedNodeDetail.keywordRoles" :key="r" class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px]">
                    # {{ r }}
                  </span>
                </div>
                
                <!-- 资金往来 -->
                <div v-if="selectedNodeDetail.moneyIn !== undefined || selectedNodeDetail.moneyOut !== undefined" class="mt-2 p-2 rounded bg-gray-50 border border-gray-100">
                   <div v-if="selectedNodeDetail.moneyIn !== undefined" class="flex justify-between text-xs mb-1">
                      <span style="color: #888">资金转入</span>
                      <span class="font-mono font-bold" style="color: #27AE60">+{{ selectedNodeDetail.moneyIn.toLocaleString() }}</span>
                   </div>
                   <div v-if="selectedNodeDetail.moneyOut !== undefined" class="flex justify-between text-xs">
                      <span style="color: #888">资金转出</span>
                      <span class="font-mono font-bold" style="color: #C0392B">-{{ selectedNodeDetail.moneyOut.toLocaleString() }}</span>
                   </div>
                </div>

                <div v-if="selectedNodeDetail.commFrequency" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">通讯频率</span>
                  <span class="text-sm font-bold" style="color: #1A3A5C">{{ selectedNodeDetail.commFrequency }} 次联络</span>
                </div>
                
                <div v-if="selectedNodeDetail.phone" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">联系电话</span>
                  <span class="text-sm font-mono" style="color: #555">{{ maskPhone(selectedNodeDetail.phone) }}</span>
                </div>
                <!-- 累犯情报 -->
                <div v-if="selectedNodeDetail.isRecidivist" class="info-item" style="background: #FFF5F5; border-radius: 4px; padding: 4px 8px; margin-top: 8px">
                  <span class="text-xs font-bold" style="color: #C0392B">⚠ 累犯风险</span>
                  <span class="text-xs font-bold" style="color: #C0392B">该人员有同类违法前科</span>
                </div>
              </div>

              <!-- 证据链展示 (当前案情重心) -->
              <div v-if="selectedNodeDetail.evidence" class="mt-4">
                <p class="text-xs font-bold mb-2" style="color: #1A3A5C">⛓️ 关联证据 (本案证据)</p>
                <div class="space-y-2">
                  <!-- 通讯证据 -->
                  <div v-if="selectedNodeDetail.evidence.communications?.length" class="space-y-2">
                    <div v-for="(c, idx) in selectedNodeDetail.evidence.communications" :key="idx" 
                      class="p-2 rounded border border-purple-100" style="background: #F9F0FF">
                      <div class="flex justify-between items-start mb-1">
                        <p class="text-[11px] font-bold text-purple-800">💬 通讯记录</p>
                        <span v-if="c.severity_level" 
                          class="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                          :style="{
                            background: c.severity_level === '刑事犯罪' ? '#FEF2F2' : '#F0FDF4',
                            color: c.severity_level === '刑事犯罪' ? '#DC2626' : '#16A34A'
                          }">
                          {{ c.severity_level }}
                        </span>
                      </div>
                      <p class="text-[10px] text-purple-700">
                         <span class="font-bold">[{{ c.type }}]</span> {{ c.content }} 
                         <span v-if="c.hit_keywords?.length" class="px-1 bg-red-100 text-red-500 rounded"> {{ c.hit_keywords.join(',') }}</span>
                      </p>
                      <p class="text-[9px] text-purple-400 mt-1 font-mono">{{ c.time }}</p>
                    </div>
                  </div>
                  <!-- 交易证据 -->
                  <div v-if="selectedNodeDetail.evidence.transactions?.length" class="space-y-2">
                    <div v-for="(t, idx) in selectedNodeDetail.evidence.transactions" :key="idx" 
                      class="p-2 rounded border border-blue-100" style="background: #F0F7FF">
                      <div class="flex justify-between items-start mb-1">
                        <p class="text-[11px] font-bold text-blue-800">💰 交易记录</p>
                        <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#F0FDF4] text-[#16A34A]">
                          行政违法
                        </span>
                      </div>
                      <div class="text-[10px] text-blue-700 flex justify-between">
                         <span>{{ t.type }}: {{ parseFloat(t.amount || 0).toLocaleString() }}元</span>
                         <span class="font-mono">{{ t.time }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 往期案件详情 (历史背景重心 - 采用更低调的档案色) -->
              <div v-if="selectedNodeDetail.relatedCasesDetail?.length" class="mt-5 pt-4 border-t border-dashed border-gray-200">
                <p class="text-xs font-bold mb-2" style="color: #888">📂 往期案件档案 (历史记录)</p>
                <div class="space-y-1">
                  <div v-for="(rc, idx) in selectedNodeDetail.relatedCasesDetail" :key="idx" class="p-2 rounded bg-gray-50 border border-gray-100 text-[10px]">
                    <div class="flex justify-between font-bold text-gray-500">
                      <span>案件号: {{ rc.case_id || "未知" }}</span>
                      <span>{{ parseFloat(rc.amount || 0).toLocaleString() }}元</span>
                    </div>
                    <div class="text-gray-400 mt-0.5 font-mono">案发时间: {{ rc.time }}</div>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex gap-2">
                <el-button size="small" type="primary" style="background: #1A3A5C; border-color: #1A3A5C; width: 100%">
                  查看完整证据链
                </el-button>
              </div>
            </div>

            <!-- 产业链统计 -->
            <div v-else>
              <div
                v-if="currentUpstreamCase && upstreamData"
                class="p-4 rounded-lg mb-4 cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
                style="background: #FDECEA; border: 2px solid #F5C6C2"
                @click="selectedNode = upstreamData.center"
              >
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-2xl font-extrabold" style="color: #C0392C">{{ currentUpstreamCase.suspect }}</p>
                    <p class="text-sm" style="color: #888">核心嫌疑人</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-black" style="color: #C0392B">{{ (illegalIncome / 10000).toFixed(2) }}</p>
                    <p class="text-xs" style="color: #888">预估非法获利(万元)</p>
                  </div>
                </div>
              </div>

              <!-- 核心统计指标 -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="p-3 rounded-lg text-center" style="background: #EEF3F8; border: 1px solid #BDD0E6">
                  <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamCount }}</p>
                  <p class="text-[10px]" style="color: #888">上游供应商</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #FDECEA; border: 1px solid #F5C6C2">
                  <p class="text-xl font-black" style="color: #C0392B">{{ coreCount }}</p>
                  <p class="text-[10px]" style="color: #888">核心嫌疑人</p>
                </div>
                <div class="p-3 rounded-lg text-center" style="background: #F0FAF0; border: 1px solid #A8D8A8">
                  <p class="text-xl font-black" style="color: #27AE60">{{ downstreamCount }}</p>
                  <p class="text-[10px]" style="color: #888">下游买家</p>
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
                      </div>
                      <p v-if="s.info" class="text-xs mt-1" style="color: #aaa">{{ s.info }}</p>
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
                      </div>
                      <p v-if="b.info" class="text-xs mt-1" style="color: #aaa">{{ b.info }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-5 pt-4" style="border-top: 1px solid #E8EEF4">
                <p class="text-xs font-bold mb-3" style="color: #888">图谱统计</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                    <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamStats.nodes }}</p>
                    <p class="text-xs" style="color: #888">节点总数</p>
                  </div>
                  <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                    <p class="text-xl font-black" style="color: #1A3A5C">{{ upstreamStats.links }}</p>
                    <p class="text-xs" style="color: #888">关系链路</p>
                  </div>
                  <div class="p-3 rounded-lg text-center" style="background: #F5F8FA">
                    <p class="text-xl font-black" style="color: #1A3A5C">{{ totalTransactions }}</p>
                    <p class="text-[10px]" style="color: #888">累计关联笔数</p>
                  </div>
                  <div class="p-3 rounded-lg text-center" style="background: #FDECEA">
                    <p class="text-xl font-black" style="color: #C0392B">{{ hiddenSources }}</p>
                    <p class="text-[10px]" style="color: #888">潜在隐匿源</p>
                  </div>
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
              <div class="legend-item"><div class="legend-dot" style="background: #C0392B"></div>关联人员</div>
              <div class="legend-item"><div class="legend-dot" style="background: #1A3A5C"></div>涉案案件</div>
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
                    <p class="text-2xl font-extrabold" style="color: #C0392C">
                      {{ selectedNodeDetail.isCase ? selectedNodeDetail.name : maskName(selectedNodeDetail.name) }}
                    </p>
                    <p class="text-sm mt-1" style="color: #888">{{ selectedNodeDetail.role || (selectedNodeDetail.isCase ? '涉案案件' : '关联人员') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-black" style="color: #C0392B">{{ selectedNodeDetail.count }}</p>
                    <p class="text-xs" style="color: #888">{{ selectedNodeDetail.isCase ? '名关联人员' : '个关联案件' }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <div v-if="selectedNodeDetail.role" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">身份角色</span>
                  <span class="tag-info">{{ selectedNodeDetail.role }}</span>
                </div>
                <div v-if="selectedNodeDetail.crimeType" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">涉嫌罪名</span>
                  <span class="text-xs" style="color: #555">{{ selectedNodeDetail.crimeType }}</span>
                </div>
                <div v-if="selectedNodeDetail.keywordRoles?.length" class="mt-2 flex gap-1 flex-wrap">
                  <span v-for="r in selectedNodeDetail.keywordRoles" :key="r" class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px]">
                    # {{ r }}
                  </span>
                </div>
                
                <!-- 资金往来 -->
                <div v-if="selectedNodeDetail.moneyIn !== undefined || selectedNodeDetail.moneyOut !== undefined" class="mt-2 p-2 rounded bg-gray-50 border border-gray-100">
                   <div v-if="selectedNodeDetail.moneyIn !== undefined" class="flex justify-between text-xs mb-1">
                      <span style="color: #888">资金转入</span>
                      <span class="font-mono font-bold" style="color: #27AE60">+{{ selectedNodeDetail.moneyIn.toLocaleString() }}</span>
                   </div>
                   <div v-if="selectedNodeDetail.moneyOut !== undefined" class="flex justify-between text-xs">
                      <span style="color: #888">资金转出</span>
                      <span class="font-mono font-bold" style="color: #C0392B">-{{ selectedNodeDetail.moneyOut.toLocaleString() }}</span>
                   </div>
                </div>

                <div v-if="selectedNodeDetail.commFrequency" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">通讯频率</span>
                  <span class="text-sm font-bold" style="color: #1A3A5C">{{ selectedNodeDetail.commFrequency }} 次联络</span>
                </div>

                <div v-if="selectedNodeDetail.caseId" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">所在案件</span>
                  <span class="text-sm">{{ selectedNodeDetail.caseId }}</span>
                </div>
                <div v-if="selectedNodeDetail.phone" class="info-item">
                  <span class="text-xs font-semibold" style="color: #888">联系电话</span>
                  <span class="text-sm font-mono" style="color: #555">{{ maskPhone(selectedNodeDetail.phone) }}</span>
                </div>

                <!-- 案件上下游关系 -->
                <div v-if="selectedNodeDetail.isCase && selectedCaseChain" class="mt-4 pt-3 border-t border-dashed border-gray-200">
                  <p class="text-xs font-bold mb-2" style="color: #1A3A5C">⛓️ 案件上下游关系</p>
                  <div class="grid grid-cols-2 gap-2">
                    <div v-if="selectedCaseChain.upstream?.length" class="p-2 rounded border border-slate-100 bg-slate-50">
                      <p class="text-[10px] font-bold text-slate-800 mb-1">⬆️ 供应商 ({{ selectedCaseChain.upstream.length }})</p>
                      <div v-for="(item, idx) in selectedCaseChain.upstream.slice(0, 3)" :key="idx" class="text-[9px] text-slate-500 truncate">
                        {{ item.name }}
                      </div>
                    </div>
                    <div v-if="selectedCaseChain.downstream?.length" class="p-2 rounded border border-green-50 bg-green-50">
                      <p class="text-[10px] font-bold text-green-800 mb-1">⬇️ 买家 ({{ selectedCaseChain.downstream.length }})</p>
                      <div v-for="(item, idx) in selectedCaseChain.downstream.slice(0, 3)" :key="idx" class="text-[9px] text-green-600 truncate">
                        {{ item.name }}
                      </div>
                    </div>
                  </div>
                  <div v-if="!selectedCaseChain.upstream?.length && !selectedCaseChain.downstream?.length" class="text-xs text-center py-2 text-gray-400">
                    暂无链条数据
                  </div>
                </div>
                <!-- 累犯情报 -->
                <div v-if="selectedNodeDetail.isRecidivist" class="info-item" style="background: #FFF5F5; border-radius: 4px; padding: 4px 8px; margin-top: 8px">
                  <span class="text-xs font-bold" style="color: #C0392B">⚠ 累犯风险</span>
                  <span class="text-xs font-bold" style="color: #C0392B">该人员有同类违法前科</span>
                </div>
              </div>

              <!-- 证据链展示 (当前案情重心) -->
              <div v-if="selectedNodeDetail.evidence" class="mt-4">
                <p class="text-xs font-bold mb-2" style="color: #1A3A5C">⛓️ 关联证据 (本案证据)</p>
                <div class="space-y-2">
                  <!-- 交易证据 -->
                  <div v-if="selectedNodeDetail.evidence.transactions?.length" class="p-2 rounded border border-blue-100" style="background: #F0F7FF">
                    <p class="text-[11px] font-bold text-blue-800 mb-1">💰 交易记录</p>
                    <div v-for="(t, idx) in selectedNodeDetail.evidence.transactions" :key="idx" class="text-[10px] text-blue-700 flex justify-between">
                       <span>{{ t.type }}: {{ parseFloat(t.amount || 0).toLocaleString() }}元</span>
                       <span class="font-mono">{{ t.time }}</span>
                    </div>
                  </div>
                  <!-- 物流证据 -->
                  <div v-if="selectedNodeDetail.evidence.logistics?.length" class="p-2 rounded border border-green-100" style="background: #F6FFED">
                    <p class="text-[11px] font-bold text-green-800 mb-1">📦 物流发货</p>
                    <div v-for="(l, idx) in selectedNodeDetail.evidence.logistics" :key="idx" class="text-[10px] text-green-700">
                       {{ l.type }}: {{ l.description }} <span class="font-mono opacity-70">({{ l.time }})</span>
                    </div>
                  </div>
                  <!-- 通讯证据 -->
                  <div v-if="selectedNodeDetail.evidence.communications?.length" class="p-2 rounded border border-purple-100" style="background: #F9F0FF">
                    <p class="text-[11px] font-bold text-purple-800 mb-1">💬 通讯记录</p>
                    <div v-for="(c, idx) in selectedNodeDetail.evidence.communications" :key="idx" class="text-[10px] text-purple-700">
                       <span class="font-bold">[{{ c.type }}]</span> {{ c.content }} 
                       <span v-if="c.hit_keywords?.length" class="px-1 bg-red-100 text-red-500 rounded"> {{ c.hit_keywords.join(',') }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 往期案件详情 (历史背景重心 - 采用更低调的档案色) -->
              <div v-if="selectedNodeDetail.relatedCasesDetail?.length" class="mt-5 pt-4 border-t border-dashed border-gray-200">
                <p class="text-xs font-bold mb-2" style="color: #888">📂 往期案件档案 (历史记录)</p>
                <div class="space-y-1">
                  <div v-for="(rc, idx) in selectedNodeDetail.relatedCasesDetail" :key="idx" class="p-2 rounded bg-gray-50 border border-gray-100 text-[10px]">
                    <div class="flex justify-between font-bold text-gray-500">
                      <span>案件号: {{ rc.case_id || "未知" }}</span>
                      <span>{{ parseFloat(rc.amount || 0).toLocaleString() }}元</span>
                    </div>
                    <div class="text-gray-400 mt-0.5 font-mono">案发时间: {{ rc.time }}</div>
                  </div>
                </div>
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
