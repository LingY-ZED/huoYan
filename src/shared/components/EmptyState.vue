<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {}
);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="mb-4 opacity-40">
      <slot name="icon">
        <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: #E8EEF4">
          <span class="text-2xl">📭</span>
        </div>
      </slot>
    </div>
    <h3 class="font-bold text-base mb-2" style="color: #1A3A5C">{{ title ?? '暂无数据' }}</h3>
    <p class="text-sm max-w-xs" style="color: #aaa">{{ description ?? '当前没有内容' }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
