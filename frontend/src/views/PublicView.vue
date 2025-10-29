<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header con logo y fecha -->
    <header class="header-container">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-16" />
        <div class="text-xl font-semibold">Turnero de Licencias</div>
      </div>
      <div class="text-right">
        <div class="text-sm capitalize">{{ fechaActual }}</div>
        <div class="text-lg font-bold">{{ horaActual }}</div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <!-- Turno Actual -->
      <div class="max-w-4xl mx-auto mb-12">
        <div class="card text-center">
          <h2 class="text-2xl text-berisso-blue mb-4">Turno Actual</h2>
          <div v-if="turnoActivo" class="space-y-4">
            <div :class="['big-number', { 'pulse-number': pulse }]">{{ turnoActivo.numero }}</div>
            <div class="text-box font-bold text-berisso-blue">Box {{ turnoActivo.box }}</div>
            <div class="flex justify-center gap-4 items-center">
              <span :class="['status-badge', estadoBadgeClass(turnoActivo.estado)]">
                {{ estadoLabel(turnoActivo.estado) }}
              </span>
            </div>
          </div>
          <div v-else class="text-xl text-gray-500">
            No hay turnos activos en este momento
          </div>
        </div>
      </div>

      <!-- Grilla de estados -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Últimos atendidos -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">Últimos Atendidos</h3>
          <div class="space-y-3">
            <div v-for="turno in ultimosAtendidos" :key="turno._id"
                 class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-xl font-bold">{{ turno.numero }}</span>
              <span class="text-berisso-green font-medium">Box {{ turno.box }}</span>
            </div>
            <div v-if="ultimosAtendidos.length === 0" class="text-sm text-gray-500">No hay atendidos recientes.</div>
          </div>
        </div>

        <!-- Turnos perdidos -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">Turnos Perdidos</h3>
          <div class="space-y-3">
            <div v-for="turno in ultimosPerdidos" :key="turno._id"
                 class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-xl font-bold">{{ turno.numero }}</span>
              <span class="text-red-500 font-medium">Box {{ turno.box }}</span>
            </div>
            <div v-if="ultimosPerdidos.length === 0" class="text-sm text-gray-500">No hay perdidos recientes.</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject, watch } from "vue";
import api from "../services/api";
import { showToast } from "../services/toast";

const socket = inject("socket");
const turnos = ref([]);
const pulse = ref(false);

// Computed properties
const turnoActivo = computed(() => {
  const llamando = turnos.value.find(t => t.estado === "llamando");
  if (llamando) return llamando;
  return turnos.value[0] || null;
});

const ultimosAtendidos = computed(() =>
  turnos.value.filter(t => t.estado === "atendido").slice(0, 5)
);

const ultimosPerdidos = computed(() =>
  turnos.value.filter(t => t.estado === "perdido").slice(0, 5)
);

// Watch para la animación de pulso (corregido)
watch(() => turnoActivo.value, (newVal) => {
  if (!newVal) return;
  pulse.value = true;
  setTimeout(() => (pulse.value = false), 420);
});

// Fecha y hora (fecha puede ser computed, hora es ref para actualizar)
const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});
const horaActual = ref(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));

// Funciones de carga y manejo de datos
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
    if (!turnos.value.find((x) => x._id === turno._id)) {
      turnos.value.unshift(turno);
    }
  } else {
    const idx = turnos.value.findIndex((x) => x._id === turno._id);
    if (idx >= 0) turnos.value.splice(idx, 1, turno);
    else turnos.value.unshift(turno);
  }
}

// Lifecycle hooks
let horaInterval = null;
onMounted(() => {
  cargarTurnos();

  if (socket) {
    socket.on("turno_actualizado", socketHandler);
  } else {
    showToast("Conexión en tiempo real no disponible", "error");
  }

  horaInterval = setInterval(() => {
    horaActual.value = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }, 60000);
});

onUnmounted(() => {
  if (socket) socket.off("turno_actualizado", socketHandler);
  if (horaInterval) clearInterval(horaInterval);
});

// Helpers de UI
function estadoLabel(e) {
  if (e === "llamando") return "Llamando";
  if (e === "atendido") return "Atendido";
  if (e === "perdido") return "Perdido";
  return e || "Pendiente";
}

function estadoBadgeClass(e) {
  if (e === "llamando") return "status-badge-llamando";
  if (e === "atendido") return "status-badge-atendido";
  if (e === "perdido") return "status-badge-perdido";
  return "status-badge-default";
}

function formatoFecha(ts) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch { 
    return "-"; 
  }
}
</script>

<style scoped>
/* Ajustes para la tarjeta principal */
.card { 
  max-width: 900px;
  @apply bg-white rounded-xl shadow-lg p-8;
}

.big-number { 
  font-size: 4.5rem;
  @apply font-bold text-berisso-blue;
}

@media (min-width: 768px) {
  .big-number {
    font-size: 6rem;
  }
}

/* Animación de pulso */
.pulse-number {
  animation: pulse 420ms cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Estilos de estado */
.status-badge {
  @apply px-4 py-2 rounded-full font-medium;
}

.status-badge-llamando { 
  @apply bg-amber-500 text-white;
}

.status-badge-atendido { 
  @apply bg-emerald-500 text-white;
}

.status-badge-perdido { 
  @apply bg-red-500 text-white;
}

/* Header */
.header-container {
  @apply bg-berisso-blue text-white px-8 py-4 flex justify-between items-center;
}
</style>
