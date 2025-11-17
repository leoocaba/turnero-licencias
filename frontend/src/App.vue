<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Fuerza re-render con :key basado en isAdmin.value -->
    <component :is="currentView" :key="isAdmin.value" />
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue';
import PublicView from './views/PublicView.vue';
import AdminView from './views/AdminView.vue';

// Lee el query param inicial
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

// Computed que retorna el componente correcto basado en isAdmin.value
const currentView = computed(() => isAdmin.value ? AdminView : PublicView);

// Cambia el param en la URL y actualiza el ref sin reload
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
  console.log('[App] setAdmin -> isAdmin.value =', isAdmin.value);
}

function toggleAdmin() { 
  setAdmin(!isAdmin.value); 
}

// Proveer a las vistas para que puedan togglear sin recargar
provide('isAdmin', isAdmin);
provide('setAdmin', setAdmin);
provide('toggleAdmin', toggleAdmin);

// Escuchar cambios del historial (botones atrás/adelante)
function onPopState() {
  isAdmin.value = readIsAdminFromUrl();
}

onMounted(() => {
  window.addEventListener('popstate', onPopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState);
});

// Watch para debug
watch(() => isAdmin.value, (newVal) => {
  console.log('[App] isAdmin cambió a:', newVal);
});
</script>

<style>
#app { min-height: 100vh; }
</style>
