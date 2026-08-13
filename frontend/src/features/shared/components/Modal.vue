<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <div 
          class="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[calc(100vw-1rem)] overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all my-auto"
          :class="maxWidthClass || 'max-w-lg'"
          @click.stop
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
            <h3 v-if="title" class="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">{{ title }}</h3>
            <slot name="header" />
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-3.5 sm:px-6 py-3.5 sm:py-5 max-h-[85vh] overflow-y-auto">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-3.5 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    maxWidthClass?: string;
  }>(),
  {
    maxWidthClass: 'max-w-lg'
  }
);

defineEmits(['close']);
</script>
