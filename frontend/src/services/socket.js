import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${location.protocol}//${location.hostname}:4000`;

const socket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  transports: ["websocket", "polling"], // usar polling como fallback
  timeout: 20000,
});

socket.on("connect", () => {
  console.info("[socket] connected", socket.id, "->", SOCKET_URL);
  // Exponer temporalmente para debugging
  window.__socket__ = socket;
});
socket.on("connect_error", (err) => {
  console.warn("[socket] connect_error", err && err.message ? err.message : err);
});
socket.on("reconnect_attempt", (n) => {
  console.info("[socket] reconnect_attempt", n);
});
socket.on("disconnect", (reason) => {
  console.info("[socket] disconnected", reason);
});

export default socket;
