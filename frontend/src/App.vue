<template>
  <div id="app">
    <!-- ...existing header/logo (si existe) ... -->
    <!-- Eliminé aquí el bloque "Turnero de Licencias" que estaba globalmente -->
    <!-- ...existing code (resto de la app / router / vistas) ... -->
    <router-view />
  </div>
</template>

<script setup>
import { ref } from "vue";
import PublicView from "./views/PublicView.vue";
import AdminView from "./views/AdminView.vue";

const view = ref("public");
</script>

<style>
/* ...existing styles... */
</style>
