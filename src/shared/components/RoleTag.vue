<script setup lang="ts">
defineProps<{
  role: string;
}>();

const roleStyles: Record<string, { bg: string; text: string }> = {
  '核心嫌疑人': { bg: 'bg-alert/10', text: 'text-alert' },
  '上游供货商': { bg: 'bg-brand/10', text: 'text-brand' },
  '下游买家': { bg: 'bg-safe/10', text: 'text-safe' },
  '中间商': { bg: 'bg-surface', text: 'text-text-secondary' },
  '资金账户持有人': { bg: 'bg-surface', text: 'text-text-secondary' },
  '证人': { bg: 'bg-fund/10', text: 'text-fund' },
};

const getRoleClass = (role: string) => {
  const style = roleStyles[role];
  return style ? `${style.bg} ${style.text}` : 'bg-surface text-text-secondary';
};
</script>

<template>
  <span
    class="px-2 py-1 rounded text-xs font-semibold"
    :class="getRoleClass(role)"
  >
    {{ role }}
  </span>
</template>
