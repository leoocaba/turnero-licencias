import { createApp, markRaw } from "vue";
import App from "./App.vue";
import socket from "./services/socket";
import "./index.css";

const app = createApp(App);

// Inyectar socket sin que Vue lo haga reactivo
app.provide("socket", markRaw(socket));


app.mount("#app");
