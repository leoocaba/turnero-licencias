<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-6 text-center">
      <div class="kicker">Turnos</div>
      <h1 class="h1 text-3xl md:text-4xl">Tu turno</h1>
      <p class="text-gray-600 mt-1">Consulta en tiempo real el estado y los últimos atendidos.</p>
    </header>

    <!-- Tarjeta principal con turno activo -->
    <section class="mb-8">
      <div v-if="turnoActivo" class="card mx-auto max-w-2xl text-center">
        <div class="text-sm text-gray-500">Tu turno</div>
        <div :class="['big-number my-2', { 'pulse-number': pulse }]" class="my-2">{{ turnoActivo.numero }}</div>
        <div class="text-lg text-gray-700 mb-4">Box {{ turnoActivo.box }}</div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div :class="estadoBadgeClass(turnoActivo.estado)" class="badge">
            {{ estadoLabel(turnoActivo.estado) }}
          </div>
          <div class="text-sm text-gray-600">Última actualización: {{ formatoFecha(turnoActivo.updatedAt) }}</div>
        </div>
      </div>

      <div v-else class="card mx-auto max-w-2xl text-center">
        <div class="text-lg font-medium text-gray-700">No hay turnos activos</div>
        <p class="text-sm text-gray-500 mt-1">Solicitá un turno desde el sector de administración o acercate al mostrador.</p>
      </div>
    </section>

    <!-- Listas: últimos atendidos y perdidos recientes -->
    <section class="grid gap-6 grid-cols-1 md:grid-cols-2">
      <div class="card">
        <div class="text-lg font-semibold mb-3">Últimos atendidos</div>
        <ul class="space-y-2">
          <li v-for="t in ultimosAtendidos" :key="t._id" class="flex justify-between items-center bg-gray-50 rounded-md px-3 py-2">
            <div class="font-medium text-gray-800">{{ t.numero }}</div>
            <div class="text-sm text-green-700">Atendido</div>
          </li>
          <li v-if="ultimosAtendidos.length === 0" class="text-sm text-gray-500">No hay atendidos recientes.</li>
        </ul>
      </div>

      <div class="card">
        <div class="text-lg font-semibold mb-3">Turnos perdidos recientes</div>
        <ul class="space-y-2">
          <li v-for="t in ultimosPerdidos" :key="t._id" class="flex justify-between items-center bg-gray-50 rounded-md px-3 py-2">
            <div class="font-medium text-gray-800">{{ t.numero }}</div>
            <div class="text-sm text-red-600">Perdido</div>
          </li>
          <li v-if="ultimosPerdidos.length === 0" class="text-sm text-gray-500">No hay turnos perdidos recientes.</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject, watch } from "vue";
import api from "../services/api";
import { showToast } from "../services/toast";

const socket = inject("socket");
const turnos = ref([]);
const pulse = ref(false);

async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data || [];
  } catch (err) {
    showToast("No se pudieron cargar los turnos", "error");
    console.error(err);
  }
}

function socketHandler(payload) {
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
}

onMounted(() => {
  cargarTurnos();

  if (socket) {
    socket.on("turno_actualizado", socketHandler);
  } else {
    showToast("Conexión en tiempo real no disponible", "error");
  }
});

onUnmounted(() => {
  if (socket) socket.off("turno_actualizado", socketHandler);
});

// Computed helpers
const turnoActivo = computed(() => {
  // Priorizar el último "llamando", sino el más reciente pendiente/atendido
  const llamando = turnos.value.find(t => t.estado === "llamando");
  if (llamando) return llamando;
  return turnos.value[0] || null;
});

const ultimosAtendidos = computed(() => turnos.value.filter(t => t.estado === "atendido").slice(0, 5));
const ultimosPerdidos = computed(() => turnos.value.filter(t => t.estado === "perdido").slice(0, 5));

// Animación al cambiar el turno principal
watch(turnoActivo, (newVal) => {
  if (!newVal) return;
  pulse.value = true;
  setTimeout(() => (pulse.value = false), 420);
});

// UX helpers
function estadoLabel(e) {
  if (e === "llamando") return "Llamando";
  if (e === "atendido") return "Atendido";
  if (e === "perdido") return "Perdido";
  return e || "Pendiente";
}
function estadoBadgeClass(e) {
  if (e === "llamando") return "badge-llamando";
  if (e === "atendido") return "badge-atendido";
  if (e === "perdido") return "badge-perdido";
  return "badge-default";
}
function formatoFecha(ts) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch { return "-"; }
}
</script>

<style scoped>
/* Ajustes para la tarjeta principal */
.card { max-width: 900px; }
.big-number { font-size: 4.5rem; }
@media (min-width: 768px) {
  .big-number { font-size: 6rem; }
}
</style>
