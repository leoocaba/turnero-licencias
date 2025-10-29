require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const Turno = require("./models/Turno"); // tu modelo
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prueba";

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.get("/api/health", (req, res) => res.json({ ok: true, env: process.env.APP_NAME || "turnero" }));

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  path: "/socket.io",
  cors: { origin: FRONTEND_URL || "*", methods: ["GET", "POST", "PUT"], credentials: true },
});

io.on("connection", (socket) => {
  console.log("[io] socket connected:", socket.id, "remote:", socket.handshake.address);
  socket.on("disconnect", (reason) => {
    console.log("[io] socket disconnected:", socket.id, reason);
  });
});

function emitir(action, turno) {
  const payload = { action, turno };
  io.emit("turno_actualizado", payload);
  console.log("[io] emitir ->", payload.action, turno && turno._id);
}

// Endpoints básicos (ajustá según tu implementación)
app.get("/api/turnos", async (req, res) => {
  try {
    const items = await Turno.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando turnos" });
  }
});

app.post("/api/turnos", async (req, res) => {
  try {
    const data = req.body || {};
    const nuevo = new Turno({
      numero: data.numero,
      box: data.box,
      estado: data.estado || "pendiente",
    });
    const saved = await nuevo.save();
    emitir("nuevo", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando turno", details: err.message });
  }
});

app.put("/api/turnos/:id", async (req, res) => {
  try {
    const updated = await Turno.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "No encontrado" });
    emitir("update", updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando turno", details: err.message });
  }
});

// Conectar a Mongo y levantar server
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("[db] Mongo conectado");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[server] Backend listo en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[db] Error conectando Mongo:", err);
    process.exit(1);
  });

module.exports = { app, server, io };
