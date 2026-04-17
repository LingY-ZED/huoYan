<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  type?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'default' | 'large';
  icon?: Component;
  disabled?: boolean;
}>();

const typeClasses: Record<string, string> = {
  primary: '!bg-brand !border-brand !text-white hover:!bg-brand-light',
  secondary: '!text-brand !border-border hover:!bg-surface',
  danger: '!bg-serious !border-serious !text-white',
  success: '!bg-safe !border-safe !text-white',
};

const sizeClasses: Record<string, string> = {
  small: '!text-sm',
  default: '',
  large: '!text-lg !h-12 !font-semibold',
};

const getButtonClass = (type?: string, size?: string) => {
  const typeClass = type ? typeClasses[type] || typeClasses.primary : typeClasses.primary;
  const sizeClass = size ? sizeClasses[size] || '' : '';
  return [typeClass, sizeClass].filter(Boolean).join(' ');
};
</script>

<template>
  <el-button
    :class="getButtonClass(type, size)"
    :disabled="disabled"
  >
    <component v-if="icon" :is="icon" class="mr-1" />
    <slot />
  </el-button>
</template>
