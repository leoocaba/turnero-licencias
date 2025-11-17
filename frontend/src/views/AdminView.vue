<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header azul (logo a la izquierda, título centrado, switch y fecha a la derecha) -->
    <header class="header-container flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-14 w-auto" />
      </div>

      <div class="header-center text-center flex-1">
        <h1 class="text-white text-2xl font-bold">Turnero de Licencias</h1>
      </div>

      <div class="header-right flex items-center gap-4">
        <div class="text-sm text-white">{{ fechaActual }}</div>
        <div class="text-lg font-semibold text-white">{{ horaActual }}</div>

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
const isAdmin = inject('isAdmin');
const toggleAdmin = inject('toggleAdmin');

const turnos = ref([]);
const numero = ref("");
const box = ref("");

const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});
const horaActual = ref(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));

async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data || [];
  } catch (err) {
    showToast("No se pudieron cargar los turnos", "error");
  }
}

function socketHandler(payload) {
  const turno = payload.turno || payload;
  if (!turno || !turno._id) return;

  const idx = turnos.value.findIndex(x => x._id === turno._id);
  if (idx >= 0) turnos.value.splice(idx, 1, turno);
  else turnos.value.unshift(turno);
}

async function crearTurno() {
  try {
    await api.post("/turnos", { numero: numero.value, box: parseInt(box.value, 10) });
    numero.value = "";
    box.value = "";
    showToast("Turno creado", "success");
  } catch (err) {
    showToast("Error al crear turno", "error");
  }
}

async function actualizarTurno(id, estado) {
  try {
    await api.put(`/turnos/${id}`, { estado });
    showToast("Cambio aplicado", "success");
  } catch (err) {
    showToast("Error", "error");
  }
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
  min-height: 72px;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
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

.button-primary:hover { background: #34a03a; }
.button-primary:disabled { opacity: 0.5; cursor: not-allowed; }

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

.button-secondary:hover { background: #001a38; }
.button-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

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

/* SWITCH (idéntico a PublicView) */
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
