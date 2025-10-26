import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

const app = createApp(App);
app.provide("socket", socket);
app.mount("#app");
