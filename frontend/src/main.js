import { createApp, markRaw } from "vue";
import App from "./App.vue";
import router from "./router"; // si existe
import socket from "./services/socket";
import "./index.css";

const app = createApp(App);

// Inyectar socket sin que Vue lo haga reactivo
app.provide("socket", markRaw(socket));

if (router) app.use(router);
app.mount("#app");

