<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header con logo y fecha (switch a la derecha) -->
    <header class="header-container flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-16" />
      </div>

      <div class="text-right header-right flex items-center gap-4">
        <div class="text-sm capitalize">{{ fechaActual }}</div>
        <div class="text-lg font-bold">{{ horaActual }}</div>

        <!-- Switch actualizado -->
        <button
          class="view-switch"
          :class="{ 'on': isAdmin.value }"
          @click="toggle"
          :aria-pressed="isAdmin.value"
          :aria-label="isAdmin.value ? 'Ver como Admin' : 'Ver como Público'"
          type="button"
        >
          <span class="switch-track" />
          <span class="switch-thumb" />
          <span class="switch-label switch-label-off">Público</span>
          <span class="switch-label switch-label-on">Admin</span>
        </button>
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
const isAdmin = inject('isAdmin');
const toggleAdmin = inject('toggleAdmin');

function toggle() {
  if (toggleAdmin) toggleAdmin();
}

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

// Watch para la animación de pulso
watch(() => turnoActivo.value, (newVal) => {
  if (!newVal) return;
  pulse.value = true;
  setTimeout(() => (pulse.value = false), 420);
});

// Fecha y hora
const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});
const horaActual = ref(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));

// Funciones
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

// Helpers
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
</script>

<style scoped>
.header-container {
  background: #002b5c;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Switch actualizado */
.view-switch {
  --w: 92px;
  --h: 36px;
  position: relative;
  width: var(--w);
  height: var(--h);
  border-radius: 999px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.switch-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  transition: background .18s ease, box-shadow .18s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.view-switch.on .switch-track {
  background: linear-gradient(90deg, rgba(62,192,74,0.95), rgba(6,128,75,0.95));
}

.switch-thumb {
  --size: calc(var(--h) - 8px);
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: white;
  box-shadow: 0 6px 18px rgba(2,6,23,0.18);
  transition: transform .18s cubic-bezier(.2,.9,.3,1), left .18s;
}

/* Mover thumb cuando está ON */
.view-switch.on .switch-thumb {
  left: calc(100% - var(--size) - 6px);
}

/* Labels dentro del switch */
.switch-label {
  position: absolute;
  font-weight: 600;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.95);
  pointer-events: none;
  transition: opacity .15s ease, transform .15s ease;
}
.switch-label-off {
  left: 14px;
  opacity: 1;
  transform: translateX(0);
}
.switch-label-on {
  right: 14px;
  opacity: 0;
  transform: translateX(6px);
}

/* Mostrar/ocultar labels según estado */
.view-switch.on .switch-label-off {
  opacity: 0;
  transform: translateX(-6px);
}
.view-switch.on .switch-label-on {
  opacity: 1;
  transform: translateX(0);
}

/* Hover sutil */
.view-switch:hover .switch-thumb { transform: translateY(-52%); }
.view-switch:hover .switch-track { box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.06); }

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  padding: 2rem;
}

.big-number {
  font-size: 4.5rem;
  font-weight: 800;
  color: #002b5c;
}

@media (min-width: 768px) {
  .big-number { font-size: 6rem; }
}

.pulse-number {
  animation: pulse 420ms cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.status-badge {
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-badge-llamando {
  background: #ffa500;
  color: white;
}

.status-badge-atendido {
  background: #3ec04a;
  color: white;
}

.status-badge-perdido {
  background: #ef4444;
  color: white;
}
</style>
