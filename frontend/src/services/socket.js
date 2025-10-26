import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://192.168.0.45:4000", {
  transports: ["websocket"],
  reconnection: true,
});

export default socket;
