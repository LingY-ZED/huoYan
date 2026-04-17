<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: 'brand' | 'serious' | 'alert' | 'safe' | 'key' | 'info' | 'fund';
}>();

const colorClasses: Record<string, string> = {
  brand: 'text-brand',
  serious: 'text-serious',
  alert: 'text-alert',
  safe: 'text-safe',
  key: 'text-key',
  info: 'text-info',
  fund: 'text-fund',
};

const getColorClass = (color?: string) => color ? colorClasses[color] || 'text-brand' : 'text-brand';
</script>

<template>
  <div class="app-card text-center p-5">
    <p class="text-xs font-semibold mb-2" :class="$props.icon ? 'text-text-secondary' : 'text-text-secondary'">
      <span v-if="icon" class="mr-1">{{ icon }}</span>
      {{ title }}
    </p>
    <p class="text-3xl font-black" :class="getColorClass(color)">
      {{ value }}
    </p>
    <p class="text-xs mt-1 text-text-muted">{{ unit }}</p>
  </div>
</template>
