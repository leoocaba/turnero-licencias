import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${location.protocol}//${location.hostname}:4000`;

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.info("[socket] connected", socket.id);
});
socket.on("connect_error", (err) => {
  console.warn("[socket] connect_error", err && err.message ? err.message : err);
});
socket.on("disconnect", (reason) => {
  console.info("[socket] disconnected", reason);
});

export default socket;
