<template>
  <div id="app">
    <PublicView v-if="!adminMode" />
    <AdminView v-else />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue';
import PublicView from './views/PublicView.vue';
import AdminView from './views/AdminView.vue';

const adminMode = ref(false);

function readAdminFromUrl() {
  return new URLSearchParams(window.location.search).get('admin') === '1';
}

function setAdminMode(value) {
  adminMode.value = value;
  const params = new URLSearchParams(window.location.search);
  if (value) {
    params.set('admin', '1');
  } else {
    params.delete('admin');
  }
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', newUrl);
  console.log('[App] adminMode es ahora:', adminMode.value);
}

function toggleMode() {
  setAdminMode(!adminMode.value);
}

provide('adminMode', adminMode);
provide('setAdminMode', setAdminMode);
provide('toggleMode', toggleMode);

onMounted(() => {
  adminMode.value = readAdminFromUrl();
  window.addEventListener('popstate', () => {
    adminMode.value = readAdminFromUrl();
  });
});
</script>

<style>
#app { min-height: 100vh; }
</style>
