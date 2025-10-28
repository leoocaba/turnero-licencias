<template>
  <div class="fixed top-4 right-4 z-50">
    <transition-group
      name="toast"
      tag="div"
      enter-active-class="animate-toast-in"
      leave-active-class="animate-toast-out"
      class="flex flex-col gap-3"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="['toast-base', toastTypeClass(t.type)]"
        role="status"
      >
        <div class="flex-1">
          <div class="font-medium">{{ t.message }}</div>
        </div>
        <button @click="dismiss(t.id)" class="ml-2 text-sm opacity-80 hover:opacity-100">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import toasts, { showToast } from "../services/toast";

function toastTypeClass(type) {
  if (type === "success") return "toast-success";
  if (type === "error") return "toast-error";
  return "toast-info";
}

function dismiss(id) {
  const idx = toasts.value.findIndex(t => t.id === id);
  if (idx >= 0) toasts.value.splice(idx, 1);
}
</script>

<style scoped>
/* estilo adicional ya en src/index.css */
</style>