import { ref } from "vue";

const toasts = ref([]);

export function showToast(message, type = "info", timeout = 3500) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx >= 0) toasts.value.splice(idx, 1);
  }, timeout);
}

export default toasts;