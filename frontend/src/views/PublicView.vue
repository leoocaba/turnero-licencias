<template>
  <div class="min-h-screen flex flex-col">
    <header class="header-container flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-16" />
      </div>

      <div class="header-right flex items-center gap-4">
        <div class="text-sm capitalize text-white">{{ fechaActual }}</div>
        <div class="text-lg font-bold text-white">{{ horaActual }}</div>

        <button
          class="view-switch"
          :class="{ 'on': isAdmin.value }"
          @click="toggleAdmin"
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
      <div class="max-w-4xl mx-auto mb-12">
        <div class="card text-center">
          <h2 class="text-2xl text-berisso-blue mb-4">Turno Actual</h2>
          <div v-if="turnoActivo" class="space-y-4">
            <div :class="['big-number', { 'pulse-number': pulse }]">{{ turnoActivo.numero }}</div>
            <div class="text-box font-bold text-berisso-blue">Box {{ turnoActivo.box }}</div>
            <span :class="['status-badge', `status-badge-${turnoActivo.estado}`]">
              {{ estadoLabel(turnoActivo.estado) }}
            </span>
          </div>
          <div v-else class="text-xl text-gray-500">No hay turnos activos</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">Últimos Atendidos</h3>
          <div class="space-y-3">
            <div v-for="turno in ultimosAtendidos" :key="turno._id"
                 class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-xl font-bold">{{ turno.numero }}</span>
              <span class="text-berisso-green font-medium">Box {{ turno.box }}</span>
            </div>
            <div v-if="ultimosAtendidos.length === 0" class="text-sm text-gray-500">Sin datos recientes</div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-xl font-semibold mb-4">Turnos Perdidos</h3>
          <div class="space-y-3">
            <div v-for="turno in ultimosPerdidos" :key="turno._id"
                 class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span class="text-xl font-bold">{{ turno.numero }}</span>
              <span class="text-red-500 font-medium">Box {{ turno.box }}</span>
            </div>
            <div v-if="ultimosPerdidos.length === 0" class="text-sm text-gray-500">Sin datos recientes</div>
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

const turnos = ref([]);
const pulse = ref(false);

const turnoActivo = computed(() => {
  const llamando = turnos.value.find(t => t.estado === "llamando");
  return llamando || turnos.value[0] || null;
});

const ultimosAtendidos = computed(() =>
  turnos.value.filter(t => t.estado === "atendido").slice(0, 5)
);

const ultimosPerdidos = computed(() =>
  turnos.value.filter(t => t.estado === "perdido").slice(0, 5)
);

const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const horaActual = ref(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));

watch(() => turnoActivo.value, () => {
  pulse.value = true;
  setTimeout(() => (pulse.value = false), 420);
});

async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data || [];
  } catch (err) {
    console.error(err);
  }
}

function socketHandler(payload) {
  const turno = payload.turno || payload;
  if (!turno || !turno._id) return;

  const idx = turnos.value.findIndex(x => x._id === turno._id);
  if (idx >= 0) turnos.value.splice(idx, 1, turno);
  else turnos.value.unshift(turno);
}

function estadoLabel(e) {
  const labels = { llamando: 'Llamando', atendido: 'Atendido', perdido: 'Perdido' };
  return labels[e] || 'Pendiente';
}

let horaInterval = null;
onMounted(() => {
  cargarTurnos();
  if (socket) socket.on("turno_actualizado", socketHandler);
  horaInterval = setInterval(() => {
    horaActual.value = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }, 60000);
});

onUnmounted(() => {
  if (socket) socket.off("turno_actualizado", socketHandler);
  if (horaInterval) clearInterval(horaInterval);
});
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

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

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
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-badge-llamando { background: #ffa500; color: white; }
.status-badge-atendido { background: #3ec04a; color: white; }
.status-badge-perdido { background: #ef4444; color: white; }

/* SWITCH */
.view-switch {
  --w: 110px;
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
}

.switch-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  transition: background 0.3s ease;
  z-index: 1;
}

.view-switch.on .switch-track {
  background: #3ec04a;
}

.switch-thumb {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.view-switch.on .switch-thumb {
  left: calc(100% - 31px);
}

.switch-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 600;
  font-size: 0.8rem;
  color: white;
  z-index: 3;
  white-space: nowrap;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.switch-label-off {
  left: 36px;
  opacity: 1;
}

.switch-label-on {
  right: 36px;
  opacity: 0;
}

.view-switch.on .switch-label-off {
  opacity: 0;
}

.view-switch.on .switch-label-on {
  opacity: 1;
}

.view-switch:hover .switch-thumb {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
</style>
