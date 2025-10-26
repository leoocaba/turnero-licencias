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
import { ref, onMounted, inject } from "vue";
import api from "../services/api";

const socket = inject("socket");
const turnos = ref([]);
const numero = ref("");
const box = ref("");

onMounted(async () => {
  const res = await api.get("/turnos");
  turnos.value = res.data;

  socket.on("turno_actualizado", (data) => {
    if (data.action === "nuevo") {
      turnos.value.unshift(data.turno);
    } else if (data.action === "update") {
      const idx = turnos.value.findIndex((t) => t._id === data.turno._id);
      if (idx >= 0) turnos.value[idx] = data.turno;
    }
  });
});

async function crearTurno() {
  const res = await api.post("/turnos", {
    numero: numero.value,
    box: parseInt(box.value),
  });
  numero.value = "";
  box.value = "";
  turnos.value.unshift(res.data);
}

async function actualizarTurno(id, estado) {
  const res = await api.put(`/turnos/${id}`, { estado });
  const idx = turnos.value.findIndex((t) => t._id === id);
  if (idx >= 0) turnos.value[idx] = res.data;
}
</script>
