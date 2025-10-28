import { createApp, markRaw } from "vue";
import App from "./App.vue";
import "./index.css"; 
import socket from "./services/socket";

const app = createApp(App);

// Evita que Vue vuelva reactivo el socket
app.provide("socket", markRaw(socket));

app.mount("#app");

