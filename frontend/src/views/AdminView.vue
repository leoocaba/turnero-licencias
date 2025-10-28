<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="kicker">Panel</div>
        <h1 class="h1 text-3xl md:text-4xl">Gestión de turnos</h1>
        <p class="text-sm text-gray-600 mt-1">Crea, llama y actualiza el estado de los turnos en tiempo real.</p>
      </div>

      <form @submit.prevent="crearTurno" class="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
        <label class="sr-only" for="numero">Número</label>
        <input id="numero" v-model="numero" required placeholder="Número (ej. A001)" class="px-3 py-2 rounded-md border border-gray-200 w-full xs:w-48" />
        <label class="sr-only" for="box">Box</label>
        <input id="box" v-model="box" required placeholder="Box" type="number" class="w-28 px-3 py-2 rounded-md border border-gray-200" />
        <button type="submit" class="btn btn-primary">Crear turno</button>
      </form>
    </header>

    <!-- Grid de turnos -->
    <section class="turnos-grid">
      <transition-group name="cards" tag="div" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="t in turnos"
          :key="t._id"
          class="card card-appear transform transition hover:-translate-y-1"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-sm text-gray-500">Turno</div>
              <div class="text-2xl font-extrabold text-gray-900">{{ t.numero }}</div>
              <div class="text-sm text-gray-600 mt-1">Box {{ t.box }}</div>

              <div class="mt-3">
                <span :class="estadoBadgeClass(t.estado)" class="badge">
                  {{ estadoLabel(t.estado) }}
                </span>
              </div>
            </div>

            <div class="flex flex-col items-end gap-2">
              <div class="flex gap-2">
                <button
                  @click="actualizarTurno(t._id, 'llamando')"
                  :disabled="t.estado === 'llamando'"
                  class="btn btn-ghost"
                  aria-label="Llamar turno"
                >Llamar</button>

                <button
                  @click="actualizarTurno(t._id, 'atendido')"
                  :disabled="t.estado === 'atendido'"
                  class="btn btn-primary"
                  aria-label="Marcar atendido"
                >Atendido</button>
              </div>

              <button
                @click="actualizarTurno(t._id, 'perdido')"
                class="btn btn-danger"
                aria-label="Marcar perdido"
              >Perdido</button>
            </div>
          </div>
        </article>
      </transition-group>
    </section>

    <!-- Footer / ayuda -->
    <footer class="mt-8 text-sm text-gray-500">
      Consejo: usa los botones para cambiar estado; los cambios se propagan en tiempo real a todas las pantallas.
    </footer>
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
</style>
