<template>
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <div class="w-10 h-10 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
    <span v-if="label" class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>
