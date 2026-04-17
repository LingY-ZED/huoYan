<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as echarts from "echarts";


const trendRef = ref<HTMLDivElement | null>(null);
const brandRef = ref<HTMLDivElement | null>(null);
const amountRef = ref<HTMLDivElement | null>(null);

const statCards = [
  { title: "本月新增案件", value: "3", unit: "件", icon: "📁", bg: "#EEF3F8", change: "+2件" },
  { title: "线索碰撞成功率", value: "73", unit: "%", icon: "🎯", bg: "#F3F0FB", change: "+5%" },
  { title: "累计涉案金额", value: "86.5", unit: "万元", icon: "💰", bg: "#FDF6EC", change: "+12.3万" },
  { title: "重点布控人员", value: "28", unit: "人", icon: "👤", bg: "#FDECEA", change: "+6人" },
];

const liveClues = [
  { id: 1, time: "10:32", case: "2024-京二检-001", tag: "danger", desc: "奥迪A4L轮毂报价280元，低于参考价53%" },
  { id: 2, time: "09:15", case: "2024-京二检-002", tag: "warning", desc: "浙江→哈尔滨跨省供货链路" },
  { id: 3, time: "昨天", case: "2024-京二检-001", tag: "purple", desc: "刘某某同时出现于案件002" },
  { id: 4, time: "昨天", case: "2024-京二检-003", tag: "danger", desc: "主观明知关键词「别声张」命中" },
  { id: 5, time: "03-28", case: "2024-京二检-002", tag: "warning", desc: "收款账号农行***4589共用" },
];

function initTrendChart() {
  if (!trendRef.value) return;
  const chart = echarts.init(trendRef.value);
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["新增案件", "完成核查"], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: 48, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: "category",
      data: ["10月", "11月", "12月", "1月", "2月", "3月"],
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
        data: [2, 3, 2, 4, 3, 3],
        itemStyle: { color: "#1A3A5C", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: "完成核查",
        type: "bar",
        data: [1, 2, 3, 2, 4, 3],
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
        data: [
          { value: 35, name: "奥迪", itemStyle: { color: "#C0392B" } },
          { value: 25, name: "博世", itemStyle: { color: "#1A3A5C" } },
          { value: 20, name: "米其林", itemStyle: { color: "#27AE60" } },
          { value: 12, name: "瓦莱奥", itemStyle: { color: "#E67E22" } },
          { value: 8, name: "其他", itemStyle: { color: "#94A3B8" } },
        ],
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
      data: ["10月", "11月", "12月", "1月", "2月", "3月"],
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
        data: [18.2, 25.5, 31.8, 28.4, 45.2, 86.5],
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

onMounted(() => {
  initTrendChart();
  initBrandChart();
  initAmountChart();
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
