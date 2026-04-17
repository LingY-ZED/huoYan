<script setup lang="ts">
export interface StatusItem {
  type: 'danger' | 'warning' | 'success' | 'info';
  label: string;
}

defineProps<{
  status: string;
  statusMap?: Record<string, StatusItem>;
}>();

const defaultStatusMap: Record<string, StatusItem> = {
  '待核查': { type: 'danger', label: '● 待核查' },
  '核查中': { type: 'warning', label: '● 核查中' },
  '已移送': { type: 'success', label: '● 已移送' },
  '待解析': { type: 'warning', label: '● 待解析' },
  '已解析': { type: 'info', label: '● 已解析' },
  '已导入': { type: 'success', label: '● 已导入' },
  '待审核': { type: 'warning', label: '● 待审核' },
  '已审核': { type: 'success', label: '● 已审核' },
};

const typeClasses: Record<string, string> = {
  danger: 'tag-danger',
  warning: 'tag-warning',
  success: 'tag-safe',
  info: 'tag-info',
};

const getStatusInfo = (status: string, customMap?: Record<string, StatusItem>) => {
  const map = customMap || defaultStatusMap;
  return map[status] || { type: 'info' as const, label: status };
};

const getStatusClass = (status: string, customMap?: Record<string, StatusItem>) => {
  const info = getStatusInfo(status, customMap);
  return typeClasses[info.type] || 'tag-info';
};
</script>

<template>
  <span :class="getStatusClass(status, statusMap)">
    {{ getStatusInfo(status, statusMap).label }}
  </span>
</template>
