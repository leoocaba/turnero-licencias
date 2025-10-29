<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header con logo y fecha -->
    <header class="header-container">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-16" />
        <div class="text-xl font-semibold">Turnero de Licencias</div>
      </div>
      <div class="text-right">
        <div class="text-xl">{{ fechaActual }}</div>
        <div class="text-2xl font-bold">{{ horaActual }}</div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <!-- Turno Actual -->
      <div class="max-w-4xl mx-auto mb-12">
        <div class="card text-center">
          <h2 class="text-2xl text-berisso-blue mb-4">Turno Actual</h2>
          <div v-if="turnoActivo" class="space-y-4">
            <div class="main-number">{{ turnoActivo.numero }}</div>
            <div class="text-box font-bold text-berisso-blue">Box {{ turnoActivo.box }}</div>
            <div class="flex justify-center gap-4 items-center">
              <span :class="['status-badge', `status-badge-${turnoActivo.estado}`]">
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
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject, watch } from "vue";
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

  setInterval(() => {
    horaActual.value = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, 60000);
});

watch(turnoActivo, (newVal) => {
  if (!newVal) return;
  pulse.value = true;
  setTimeout(() => (pulse.value = false), 420);
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

// Fecha y hora actual
const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const horaActual = computed(() => {
  return new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
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

/* Estilos generales */
.header-container {
  background-color: #f8fafc;
  padding: 1rem;
  border-bottom: 1px solid #e1e1e1;
}
.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}
.status-badge-llamando { background-color: #f59e0b; color: white; }
.status-badge-atendido { background-color: #10b981; color: white; }
.status-badge-perdido { background-color: #ef4444; color: white; }

/* Colores personalizados */
.text-berisso-blue { color: #1e3a8a; }
.text-berisso-green { color: #065f46; }
</style>
