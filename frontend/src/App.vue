<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <KeepAlive>
      <PublicView v-if="!isAdmin.value" :key="'public-' + isAdmin.value" />
      <AdminView v-else :key="'admin-' + isAdmin.value" />
    </KeepAlive>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue';
import PublicView from './views/PublicView.vue';
import AdminView from './views/AdminView.vue';

function readIsAdminFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('admin') || params.get('modo');
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

const isAdmin = ref(readIsAdminFromUrl());

function setAdmin(value) {
  const params = new URLSearchParams(window.location.search);
  if (value) params.set('admin', '1');
  else {
    params.delete('admin');
    params.delete('modo');
  }
  const newSearch = params.toString();
  history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
  isAdmin.value = !!value;
  console.log('[App] setAdmin -> isAdmin.value es ahora:', isAdmin.value);
}

function toggleAdmin() { 
  console.log('[App] toggleAdmin llamado');
  setAdmin(!isAdmin.value); 
}

provide('isAdmin', isAdmin);
provide('setAdmin', setAdmin);
provide('toggleAdmin', toggleAdmin);

function onPopState() {
  isAdmin.value = readIsAdminFromUrl();
}

onMounted(() => {
  window.addEventListener('popstate', onPopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState);
});
</script>

<style>
#app { min-height: 100vh; }
</style>
