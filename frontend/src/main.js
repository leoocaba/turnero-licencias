import { createApp } from "vue";
import App from "./App.vue";
import socket from "./services/socket";

const app = createApp(App);

// Socket esté disponible globalmente
app.provide("socket", socket);

app.mount("#app");
