<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <PublicView v-if="!isAdmin.value" />
    <AdminView v-else />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch } from 'vue';
import PublicView from './views/PublicView.vue';
import AdminView from './views/AdminView.vue';

function readIsAdminFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const v = params.get('admin');
  return v === '1';
}

const isAdmin = ref(readIsAdminFromUrl());

function setAdmin(value) {
  isAdmin.value = value;
  const params = new URLSearchParams(window.location.search);
  if (value) {
    params.set('admin', '1');
  } else {
    params.delete('admin');
  }
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', newUrl);
}

function toggleAdmin() {
  setAdmin(!isAdmin.value);
}

provide('isAdmin', isAdmin);
provide('toggleAdmin', toggleAdmin);

watch(() => isAdmin.value, (newVal) => {
  console.log('[App] isAdmin changed to:', newVal);
});

onMounted(() => {
  window.addEventListener('popstate', () => {
    isAdmin.value = readIsAdminFromUrl();
  });
});
</script>

<style>
#app { min-height: 100vh; }
</style>
