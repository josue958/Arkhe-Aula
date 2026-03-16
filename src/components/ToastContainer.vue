<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="toastStore.dismiss(toast.id)"
      >
        <span class="toast-icon">{{ icons[toast.type] }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-icon {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.toast-message { flex: 1; font-size: 14px; }
.toast { cursor: pointer; }

/* Transitions */
.toast-enter-active { animation: slideInRight 0.25s ease; }
.toast-leave-active { animation: slideInRight 0.2s ease reverse; }
</style>
