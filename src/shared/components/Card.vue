<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean | string;
  }>(),
  { padded: true }
);
</script>

<template>
  <div :class="['app-card', padded ? 'p-5' : '']">
    <slot />
  </div>
</template>
