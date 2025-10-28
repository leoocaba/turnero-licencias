<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-6">
      <div class="kicker">Turnos</div>
      <h1 class="h1">Estado público</h1>
      <p class="text-gray-600 mt-2">Lista en tiempo real de turnos y su estado.</p>
    </header>

    <section class="turnos-grid">
      <div v-for="t in turnos" :key="t._id" class="card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">Turno</div>
            <div class="text-lg font-semibold">{{ t.numero }}</div>
            <div class="text-sm text-gray-500">Box {{ t.box }}</div>
          </div>
          <div>
            <span :class="estadoBadge(t.estado)" class="text-sm px-3 py-1 rounded-full font-medium">{{ t.estado }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject } from "vue";
import api from "../services/api";
import { showToast } from "../services/toast";

const socket = inject("socket");
const turnos = ref([]);

function estadoBadge(estado) {
  if (estado === "llamando") return "bg-amber-100 text-amber-800";
  if (estado === "atendido") return "bg-emerald-100 text-emerald-800";
  if (estado === "perdido") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data || [];
  } catch (err) {
    showToast("Error al cargar turnos", "error");
  }
}

onMounted(() => {
  cargarTurnos();

  if (socket) {
    const handler = (payload) => {
      const data = payload || {};
      const turno = data.turno || payload;
      const action = data.action || (turno && turno._id ? "update" : "nuevo");
      if (!turno) return;

      if (action === "nuevo") {
        if (!turnos.value.find((x) => x._id === turno._id)) turnos.value.unshift(turno);
      } else {
        const idx = turnos.value.findIndex((x) => x._id === turno._id);
        if (idx >= 0) turnos.value.splice(idx, 1, turno);
        else turnos.value.unshift(turno);
      }
    };

    socket.on("turno_actualizado", handler);
    onUnmounted(() => socket.off("turno_actualizado", handler));
  } else {
    showToast("Socket no conectado", "error");
  }
});
</script>
