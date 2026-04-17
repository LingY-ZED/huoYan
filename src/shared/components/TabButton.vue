<script setup lang="ts">
import { RouterLink } from 'vue-router';

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  to?: string;
}

defineProps<{
  tabs: TabItem[];
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="flex items-center gap-1">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to || `#${tab.key}`"
      custom
      v-slot="{ navigate, isActive }"
    >
      <button
        class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        :class="isActive ? 'bg-brand text-white' : 'bg-ground text-text-secondary hover:bg-surface'"
        @click="navigate"
      >
        <span v-if="tab.icon" class="mr-1">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </RouterLink>
  </div>
</template>
