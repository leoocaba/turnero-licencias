<template>
  <div>
    <h2 class="text-xl font-semibold mb-3 text-gray-700">Turnos actuales</h2>
    <ul>
      <li
        v-for="t in turnos"
        :key="t._id"
        class="border rounded p-2 mb-2 bg-white shadow-sm"
      >
        Turno <b>{{ t.numero }}</b> — Box {{ t.box || '-' }} — Estado: <i>{{ t.estado }}</i>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import api from "../services/api";

const socket = inject("socket");
const turnos = ref([]);

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
</script>
