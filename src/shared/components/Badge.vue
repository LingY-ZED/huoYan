<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  tone?: "neutral" | "serious" | "alert" | "safe" | "key" | "info";
}>();

const cls = computed(() => {
  switch (props.tone) {
    case "serious":
      return "tag-danger";
    case "alert":
      return "tag-warning";
    case "safe":
      return "tag-success";
    case "key":
      return "tag-purple";
    case "info":
      return "tag-info";
    default:
      return "tag-info";
  }
});
</script>

<template>
  <span class="inline-flex items-center" :class="cls">
    <slot />
  </span>
</template>
