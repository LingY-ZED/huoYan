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
    <template v-for="tab in tabs" :key="tab.key">
      <RouterLink
        v-if="tab.to"
        :to="tab.to"
        custom
        v-slot="{ navigate, isActive }"
      >
        <button
          class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          :class="isActive ? 'bg-[#1A3A5C] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
          @click="navigate"
        >
          <span v-if="tab.icon" class="mr-1">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </RouterLink>
      <button
        v-else
        class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        :class="modelValue === tab.key ? 'bg-[#1A3A5C] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
        @click="$emit('update:modelValue', tab.key)"
      >
        <span v-if="tab.icon" class="mr-1">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </template>
  </div>
</template>
