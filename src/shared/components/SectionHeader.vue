<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="flex items-end justify-between mb-5">
    <div>
      <h2 class="text-xl font-bold" style="color: #1A3A5C">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm mt-1" style="color: #888">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
