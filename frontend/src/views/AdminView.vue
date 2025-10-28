<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <header class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="kicker">Panel de administración</div>
        <h1 class="h1">Gestión de turnos</h1>
      </div>

      <form @submit.prevent="crearTurno" class="flex gap-2 items-center">
        <input v-model="numero" required placeholder="Número" class="px-3 py-2 rounded-md border border-gray-200" />
        <input v-model="box" required placeholder="Box" type="number" class="w-20 px-3 py-2 rounded-md border border-gray-200" />
        <button type="submit" class="btn btn-primary">Crear</button>
      </form>
    </header>

    <section class="turnos-grid">
      <div v-for="t in turnos" :key="t._id" class="card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-sm text-gray-500">Turno</div>
            <div class="text-xl font-semibold">{{ t.numero }} <span class="text-sm text-gray-500">- Box {{ t.box }}</span></div>
            <div class="mt-2 inline-flex items-center gap-2">
              <span :class="estadoBadge(t.estado)" class="text-xs px-2 py-1 rounded-full font-medium">{{ t.estado }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <div class="flex flex-col sm:flex-row gap-2">
              <button @click="actualizarTurno(t._id, 'llamando')" :disabled="t.estado === 'llamando'" class="btn btn-ghost">Llamar</button>
              <button @click="actualizarTurno(t._id, 'atendido')" :disabled="t.estado === 'atendido'" class="btn btn-primary">Atendido</button>
            </div>
            <button @click="actualizarTurno(t._id, 'perdido')" class="btn btn-danger">Perdido</button>
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
const numero = ref("");
const box = ref("");

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

async function crearTurno() {
  try {
    await api.post("/turnos", { numero: numero.value, box: parseInt(box.value, 10) });
    numero.value = "";
    box.value = "";
    showToast("Turno solicitado", "success");
  } catch (err) {
    showToast("No se pudo crear turno", "error");
  }
}

async function actualizarTurno(id, estado) {
  try {
    await api.put(`/turnos/${id}`, { estado });
    showToast("Estado actualizado", "success");
  } catch (err) {
    showToast("Error al actualizar", "error");
  }
}
</script>
