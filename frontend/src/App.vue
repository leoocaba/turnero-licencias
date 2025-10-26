<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <h1 class="text-2xl font-bold mb-4 text-center text-blue-700">🗓️ Turnero de Licencias</h1>

    <div class="flex justify-center gap-4 mb-6">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded"
        @click="view = 'public'"
      >
        Vista Pública
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded"
        @click="view = 'admin'"
      >
        Vista Admin
      </button>
    </div>

    <PublicView v-if="view === 'public'" />
    <AdminView v-else />
  </div>
</template>

<script setup>
import { ref } from "vue";
import PublicView from "./views/PublicView.vue";
import AdminView from "./views/AdminView.vue";

const view = ref("public");
</script>
