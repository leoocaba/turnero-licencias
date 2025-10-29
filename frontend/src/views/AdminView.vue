<template>
  <div class="min-h-screen flex flex-col">
    <header class="header-container">
      <div class="flex items-center gap-4">
        <img src="../assets/logo-berisso.svg" alt="Municipalidad de Berisso" class="h-16" />
        <div class="text-xl font-semibold">Panel de Administración</div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
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
        <div v-for="turno in turnos" :key="turno._id" 
             class="card hover:shadow-xl">
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
import { ref, onMounted, onUnmounted, inject } from "vue";
import api from "../services/api";
import { showToast } from "../services/toast";

const socket = inject("socket");
const turnos = ref([]);
const numero = ref("");
const box = ref("");

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

// Manejo de emisiones socket (sin duplicados)
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

  if (socket) {
    socket.on("turno_actualizado", socketHandler);
  } else {
    showToast("Socket no conectado", "error");
  }
});

onUnmounted(() => {
  if (socket) socket.off("turno_actualizado", socketHandler);
});

// Crear turno (servidor es fuente de verdad)
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

// Actualizar estado (el servidor emitirá la actualización)
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
function estadoBadgeClass(e) {
  if (e === "llamando") return "badge-llamando";
  if (e === "atendido") return "badge-atendido";
  if (e === "perdido") return "badge-perdido";
  return "badge-default";
}
</script>

<style scoped>
/* ajustes puntuales para la vista admin */
.cards-enter-active, .cards-leave-active { transition: all .25s ease; }
.cards-enter-from { opacity: 0; transform: translateY(6px); }
.cards-enter-to { opacity: 1; transform: translateY(0); }

.header-container {
  background-color: #f8fafc;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.button-primary {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.button-primary:hover {
  background-color: #2563eb;
}

.button-secondary {
  background-color: #e5e7eb;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.button-secondary:hover {
  background-color: #d1d5db;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge-llamando {
  background-color: #3b82f6;
  color: white;
}

.status-badge-atendido {
  background-color: #4caf50;
  color: white;
}

.status-badge-perdido {
  background-color: #f44336;
  color: white;
}
</style>
