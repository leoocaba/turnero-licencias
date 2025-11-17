<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header azul (logo a la izquierda, título centrado, switch y fecha a la derecha) -->
    <header class="header-container flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-14 w-auto" />
      </div>

      <div class="header-center text-center flex-1">
        <h1 class="text-white text-2xl font-bold mb-2">Turnero de Licencias</h1>
      </div>

      <!-- Mover switch aquí para que quede igual que en PublicView -->
      <div class="text-right header-right flex items-center gap-4">
        <div class="text-sm">{{ fechaActual }}</div>
        <div class="text-lg font-semibold">{{ horaActual }}</div>

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

    <main class="flex-1 p-6">
      <!-- Panel de control -->
      <div class="card mb-8">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-berisso-blue">Gestión de Turnos</h1>
            <p class="text-gray-600">Administra los turnos en tiempo real</p>
          </div>
          
          <form @submit.prevent="crearTurno" class="flex gap-4">
            <input v-model="numero" required
                   class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-berisso-blue"
                   placeholder="Número (ej: A001)" />
            <input v-model="box" required type="number"
                   class="px-4 py-2 border rounded-lg w-24 focus:ring-2 focus:ring-berisso-blue"
                   placeholder="Box" />
            <button type="submit" class="button-primary">
              Crear Turno
            </button>
          </form>
        </div>
      </div>

      <!-- Lista de turnos -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="turno in turnos" :key="turno._id" class="card hover:shadow-xl">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-3xl font-bold text-berisso-blue">{{ turno.numero }}</span>
              <div class="text-gray-600">Box {{ turno.box }}</div>
            </div>
            <span :class="['status-badge', `status-badge-${turno.estado}`]">
              {{ estadoLabel(turno.estado) }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <button @click="actualizarTurno(turno._id, 'llamando')"
                    :disabled="turno.estado === 'llamando'"
                    class="button-secondary">
              Llamar
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button @click="actualizarTurno(turno._id, 'atendido')"
                      :disabled="turno.estado === 'atendido'"
                      class="button-primary">
                Atendido
              </button>
              <button @click="actualizarTurno(turno._id, 'perdido')"
                      class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Perdido
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from "vue";
import api from "../services/api";
import { showToast } from "../services/toast";

const socket = inject("socket");
const turnos = ref([]);
const numero = ref("");
const box = ref("");

// inject SPA toggle helpers
const isAdmin = inject('isAdmin');
const toggleAdmin = inject('toggleAdmin');

// Crear una función local para el botón
function toggle() {
  console.log('[AdminView] toggle called, toggleAdmin=', toggleAdmin);
  if (toggleAdmin) toggleAdmin();
}

// Cargar turnos iniciales
async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data || [];
  } catch (err) {
    showToast("No se pudieron cargar los turnos", "error");
    console.error(err);
  }
}

// Manejo de emisiones socket
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

onMounted(() => {
  cargarTurnos();
  if (socket) socket.on("turno_actualizado", socketHandler);
  else showToast("Socket no conectado", "error");
});

onUnmounted(() => {
  if (socket) socket.off("turno_actualizado", socketHandler);
});

// Crear / actualizar turnos
async function crearTurno() {
  try {
    await api.post("/turnos", { numero: numero.value, box: parseInt(box.value, 10) });
    numero.value = "";
    box.value = "";
    showToast("Turno creado. Se notificará a todas las pantallas.", "success");
  } catch (err) {
    showToast("Error al crear turno", "error");
    console.error(err);
  }
}

async function actualizarTurno(id, estado) {
  try {
    await api.put(`/turnos/${id}`, { estado });
    showToast("Cambio aplicado", "success");
  } catch (err) {
    showToast("No se pudo actualizar el estado", "error");
    console.error(err);
  }
}

// UX helpers
function estadoLabel(e) {
  if (e === "llamando") return "Llamando";
  if (e === "atendido") return "Atendido";
  if (e === "perdido") return "Perdido";
  return e || "Pendiente";
}

// Fecha y hora
const fechaActual = computed(() => new Date().toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
const horaActual = ref(new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }));

let _interval = null;
onMounted(() => {
  _interval = setInterval(() => {
    horaActual.value = new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
  }, 60000);
});
onUnmounted(() => {
  if (_interval) clearInterval(_interval);
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
  min-height: 72px;
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex: 1;
}

/* SWITCH: variables a nivel raíz del botón */
.view-switch {
  --w: 120px;
  --h: 38px;
  --thumb-size: calc(var(--h) - 10px);
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

/* Track (detrás) */
.switch-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  transition: background .18s ease, box-shadow .18s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  z-index: 1;
}

/* Track cuando está ON (verde) */
.view-switch.on .switch-track {
  background: linear-gradient(90deg, rgba(62,192,74,0.95), rgba(6,128,75,0.95));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}

/* Thumb (blanco, se mueve) */
.switch-thumb {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background: white;
  box-shadow: 0 6px 18px rgba(2,6,23,0.18);
  transition: left .2s cubic-bezier(0.2, 0.9, 0.3, 1);
  z-index: 2;
}

/* Mover thumb cuando está ON */
.view-switch.on .switch-thumb {
  left: calc(100% - var(--thumb-size) - 8px);
}

/* Labels (texto Público/Admin) */
.switch-label {
  position: absolute;
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity .2s ease, transform .2s ease;
  z-index: 3;
  color: rgba(255,255,255,0.95);
}

/* Label OFF (Público, visible al inicio) */
.switch-label-off {
  left: calc(var(--thumb-size) + 16px);
  opacity: 1;
  transform: translateX(0);
  color: #ffffff;
}

/* Label ON (Admin, oculto al inicio) */
.switch-label-on {
  right: calc(var(--thumb-size) + 16px);
  opacity: 0;
  transform: translateX(6px);
  color: rgba(255,255,255,0.6);
}

/* Cuando está ON: mostrar Admin, ocultar Público */
.view-switch.on .switch-label-off {
  opacity: 0;
  transform: translateX(-6px);
}

.view-switch.on .switch-label-on {
  opacity: 1;
  transform: translateX(0);
  color: #ffffff;
}

/* Hover sutil */
.view-switch:hover .switch-thumb {
  box-shadow: 0 8px 24px rgba(2,6,23,0.22);
}

.view-switch:hover .switch-track {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.08);
}

/* Cards y botones */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  padding: 2rem;
}

.button-primary {
  background: #3ec04a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.button-primary:hover {
  background: #34a03a;
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-secondary {
  background: #002b5c;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.button-secondary:hover {
  background: #001a38;
}

.button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
