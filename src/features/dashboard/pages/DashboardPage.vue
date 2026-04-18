<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as echarts from "echarts";
import { repositories } from "@/services";
import { get } from "@/services/api/client";
import dayjs from "dayjs";


const trendRef = ref<HTMLDivElement | null>(null);
const brandRef = ref<HTMLDivElement | null>(null);
const amountRef = ref<HTMLDivElement | null>(null);

const statCards = ref([
  { title: "案件总数", value: "0", unit: "件", icon: "📁", bg: "#EEF3F8", change: "--" },
  { title: "可疑线索数", value: "0", unit: "条", icon: "🎯", bg: "#F3F0FB", change: "--" },
  { title: "累计涉案金额", value: "0", unit: "万元", icon: "💰", bg: "#FDF6EC", change: "--" },
  { title: "重点布控人员", value: "0", unit: "人", icon: "👤", bg: "#FDECEA", change: "--" },
]);

const liveClues = ref<any[]>([]);

function initTrendChart() {
  if (!trendRef.value) return;
  const chart = echarts.init(trendRef.value);
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["新增案件", "完成核查"], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: 48, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: "category",
      data: [],
      axisLine: { lineStyle: { color: "#D0D5DD" } },
      axisLabel: { fontSize: 11, color: "#888" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#E8EEF4" } },
      axisLabel: { fontSize: 11, color: "#888" },
    },
    series: [
      {
        name: "新增案件",
        type: "bar",
        data: [],
        itemStyle: { color: "#1A3A5C", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: "完成核查",
        type: "bar",
        data: [],
        itemStyle: { color: "#C0392B", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
    ],
  });
  const resize = () => chart.resize();
  window.addEventListener("resize", resize);
}

function initBrandChart() {
  if (!brandRef.value) return;
  const chart = echarts.init(brandRef.value);
  chart.setOption({
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", right: 16, top: "center", textStyle: { fontSize: 12 } },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["35%", "50%"],
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        data: [],
      },
    ],
  });
  const resize = () => chart.resize();
  window.addEventListener("resize", resize);
}

function initAmountChart() {
  if (!amountRef.value) return;
  const chart = echarts.init(amountRef.value);
  chart.setOption({
    tooltip: { trigger: "axis", background: "rgba(26,58,92,0.92)", textStyle: { color: "#fff", fontSize: 12 } },
    grid: { left: 48, right: 16, top: 10, bottom: 24 },
    xAxis: {
      type: "category",
      data: [],
      axisLine: { lineStyle: { color: "#D0D5DD" } },
      axisLabel: { fontSize: 11, color: "#888" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#E8EEF4" } },
      axisLabel: { fontSize: 11, color: "#888" },
    },
    series: [
      {
        type: "line",
        data: [],
        smooth: true,
        lineStyle: { color: "#C0392B", width: 2 },
        itemStyle: { color: "#C0392B" },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(192,57,43,0.15)" }, { offset: 1, color: "rgba(192,57,43,0)" }] } },
      },
    ],
  });
  const resize = () => chart.resize();
  window.addEventListener("resize", resize);
}

async function fetchDashboardData() {
  try {
    // 1. Fetch cases
    const casesRes = await repositories.cases.listCases({ limit: 500 });
    const cases = Array.isArray(casesRes) ? casesRes : ((casesRes as any)?.list || (casesRes as any)?.data || []);
    
    // 2. Fetch persons
    const personsRes = await get<any>('/ledger/persons');
    const persons = Array.isArray(personsRes) ? personsRes : ((personsRes as any)?.list || (personsRes as any)?.data || []);
    
    // 3. Fetch transactions
    const transRes = await get<any>('/ledger/transactions');
    const transactions = Array.isArray(transRes) ? transRes : ((transRes as any)?.list || (transRes as any)?.data || []);

    // Fetch suspicious clues for all cases
    let suspiciousCount = 0;
    const liveCluesData = [];
    for (const c of cases) {
      try {
        const suspicious = await repositories.cases.getCaseSuspicious(c.id.toString());
        const clues = Array.isArray(suspicious) ? suspicious : ((suspicious as any)?.data || []);
        suspiciousCount += clues.length;
        
        for (const clue of clues) {
          liveCluesData.push({
            id: clue.id || Math.random(),
            time: "最新",
            case: c.case_no,
            tag: clue.severity_level === '刑事犯罪' ? 'danger' : 'warning',
            desc: clue.evidence_text?.substring(0, 30) + '...'
          });
        }
      } catch (err) {
        // ignore individual case clue fetch error
      }
    }
    
    if (liveCluesData.length > 0) {
      liveClues.value = liveCluesData.slice(0, 10);
    }

    // Update Stats
    const totalCases = cases.length;
    const totalAmount = cases.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    const keyPersonsCount = persons.length;

    statCards.value = [
      { title: "案件总数", value: totalCases.toString(), unit: "件", icon: "📁", bg: "#EEF3F8", change: "--" },
      { title: "可疑线索数", value: suspiciousCount.toString(), unit: "条", icon: "🎯", bg: "#F3F0FB", change: "--" },
      { title: "累计涉案金额", value: (totalAmount / 10000).toFixed(1), unit: "万元", icon: "💰", bg: "#FDF6EC", change: "--" },
      { title: "重点布控人员", value: keyPersonsCount.toString(), unit: "人", icon: "👤", bg: "#FDECEA", change: "--" },
    ];

    // Chart 1: Case Trend (group by month from cases)
    const trendMap = new Map<string, number>();
    cases.forEach((c: any) => {
      const month = dayjs(c.created_at).format('YYYY-MM');
      trendMap.set(month, (trendMap.get(month) || 0) + 1);
    });
    const sortedMonths = Array.from(trendMap.keys()).sort();
    const trendData = sortedMonths.map(m => trendMap.get(m)!);

    if (trendRef.value) {
      const chart = echarts.getInstanceByDom(trendRef.value) || echarts.init(trendRef.value);
      chart.setOption({
        xAxis: { data: sortedMonths },
        series: [{ data: trendData }, { data: [] }] // Replace with real data
      });
    }

    // Chart 2: Brand Distribution
    const brandMap = new Map<string, number>();
    cases.forEach((c: any) => {
      const brand = c.brand || '未知';
      brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
    });
    const brandData = Array.from(brandMap.entries()).map(([name, value]) => ({ name, value }));

    if (brandRef.value) {
      const chart = echarts.getInstanceByDom(brandRef.value) || echarts.init(brandRef.value);
      chart.setOption({
        series: [{ data: brandData }]
      });
    }

    // Chart 3: Amount Trend (from transactions)
    const amountMap = new Map<string, number>();
    transactions.forEach((t: any) => {
      const month = dayjs(t.transaction_time).format('YYYY-MM');
      amountMap.set(month, (amountMap.get(month) || 0) + (t.amount || 0));
    });
    const sortedTransMonths = Array.from(amountMap.keys()).sort();
    const transData = sortedTransMonths.map(m => (amountMap.get(m)! / 10000).toFixed(1));

    if (amountRef.value) {
      const chart = echarts.getInstanceByDom(amountRef.value) || echarts.init(amountRef.value);
      chart.setOption({
        xAxis: { data: sortedTransMonths },
        series: [{ data: transData }]
      });
    }

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }
}

onMounted(() => {
  initTrendChart();
  initBrandChart();
  initAmountChart();
  fetchDashboardData();
});
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-4 gap-5 mb-6">
      <div v-for="card in statCards" :key="card.title" class="stat-card">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium mb-2" style="color: #888">{{ card.title }}</p>
            <p class="text-[36px] font-extrabold leading-none" style="color: #1A3A5C">
              {{ card.value }}<span class="text-[13px] font-normal ml-1" style="color: #888">{{ card.unit }}</span>
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            :style="{ background: card.bg }"
          >
            {{ card.icon }}
          </div>
        </div>
        <div class="mt-3 text-xs" style="color: #aaa">
          较上月 <span style="color: #27AE60">{{ card.change }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5 mb-5">
      <div class="app-card p-6">
        <div class="card-title !mb-0">近半年案件新增趋势</div>
        <div ref="trendRef" style="width: 100%; height: 260px; margin-top: 16px"></div>
      </div>
      <div class="app-card p-6">
        <div class="card-title !mb-0">涉案品牌分布</div>
        <div ref="brandRef" style="width: 100%; height: 260px; margin-top: 16px"></div>
      </div>
      <div class="app-card p-6">
        <div class="card-title !mb-0">涉案金额走势（万元）</div>
        <div ref="amountRef" style="width: 100%; height: 260px; margin-top: 16px"></div>
      </div>
    </div>

    <div class="app-card p-6">
      <div class="card-title !mb-0">实时侵权线索动态</div>
      <div class="space-y-3 overflow-y-auto" style="max-height: 320px">
        <div
          v-for="item in liveClues"
          :key="item.id"
          class="flex items-center justify-between p-3 rounded-lg"
          style="background: #F5F8FA; border: 1px solid #E8EEF4"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs" style="color: #aaa">{{ item.time }}</span>
            <span class="text-sm font-semibold" style="color: #1A3A5C">{{ item.case }}</span>
            <span v-if="item.tag === 'danger'" class="tag-danger">价格异常</span>
            <span v-else-if="item.tag === 'warning'" class="tag-warning">跨省销售</span>
            <span v-else class="tag-purple">多案关联</span>
          </div>
          <span class="text-xs" style="color: #888">{{ item.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
