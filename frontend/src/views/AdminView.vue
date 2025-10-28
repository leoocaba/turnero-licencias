<template>
  <div>
    <h2 class="text-xl font-semibold mb-3 text-gray-700">Panel de Administración</h2>

    <form @submit.prevent="crearTurno" class="mb-4 flex gap-2">
      <input v-model="numero" placeholder="Número" class="border p-2 rounded" />
      <input v-model="box" type="number" placeholder="Box" class="border p-2 rounded" />
      <button class="bg-blue-600 text-white px-4 py-2 rounded">Crear</button>
    </form>

    <ul>
      <li
        v-for="t in turnos"
        :key="t._id"
        class="border rounded p-2 mb-2 bg-white shadow-sm flex justify-between"
      >
        <span>Turno <b>{{ t.numero }}</b> — Box {{ t.box || '-' }} — {{ t.estado }}</span>
        <button
          @click="actualizarTurno(t._id, 'atendido')"
          class="bg-green-500 text-white px-2 rounded"
        >
          Marcar atendido
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject } from "vue";
import api from "../services/api";

const socket = inject("socket");
const turnos = ref([]);
const numero = ref("");
const box = ref("");

onMounted(() => {
  cargarTurnos();

  if (socket) {
    const handler = (data) => {
      if (data.action === "nuevo") {
        // Evitar duplicados: insertar solo si no existe el _id
        if (!turnos.value.find((t) => t._id === data.turno._id)) {
          turnos.value.unshift(data.turno);
        }
      } else if (data.action === "update") {
        const idx = turnos.value.findIndex((t) => t._id === data.turno._id);
        if (idx >= 0) turnos.value[idx] = data.turno;
        else turnos.value.unshift(data.turno);
      }
    };

    socket.on("turno_actualizado", handler);

    onUnmounted(() => {
      socket.off("turno_actualizado", handler);
    });
  } else {
    console.warn("⚠️ Socket no inyectado en AdminView");
  }
});

async function cargarTurnos() {
  try {
    const res = await api.get("/turnos");
    turnos.value = res.data;
  } catch (err) {
    console.error("Error al cargar turnos:", err.message);
  }
}

async function crearTurno() {
  try {
    const res = await api.post("/turnos", {
      numero: numero.value,
      box: parseInt(box.value),
    });
    // No insertar localmente: el servidor emite y el handler lo añadirá.
    numero.value = "";
    box.value = "";
    // opcional: podrías mostrar un toast o feedback aquí
  } catch (err) {
    console.error("Error al crear turno:", err.message);
  }
}

// Añadí botones para cambiar estado rápidamente
async function actualizarTurno(id, estado) {
  try {
    const res = await api.put(`/turnos/${id}`, { estado });
    const idx = turnos.value.findIndex((t) => t._id === id);
    if (idx >= 0) turnos.value[idx] = res.data;
  } catch (err) {
    console.error("Error al actualizar turno:", err.message);
  }
}
</script>
