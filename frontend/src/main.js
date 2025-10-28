import { createApp, markRaw } from "vue";
import App from "./App.vue";
import socket from "./services/socket";

const app = createApp(App);

// Socket esté disponible globalmente sin que Vue intente hacerlo reactivo
app.provide("socket", markRaw(socket));

app.mount("#app");
