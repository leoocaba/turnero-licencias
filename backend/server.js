const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Turno = require("./models/Turno"); // asegúrate que exporte el modelo correctamente

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prueba";

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Rutas básicas
app.get("/api/health", (req, res) => res.json({ ok: true, env: process.env.APP_NAME || "turnero" }));

// Server + socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: FRONTEND_URL || "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true },
});

io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);
  socket.on("disconnect", (reason) => {
    console.log("Socket desconectado:", socket.id, reason);
  });
});

// Helper para emitir actualizaciones
function emitirActualizacion(action, turno) {
  const payload = { action, turno };
  io.emit("turno_actualizado", payload);
  console.log("Emitiendo turno_actualizado", payload.action, turno && turno._id);
}

/*
  Endpoints para turnos
  - GET /api/turnos
  - POST /api/turnos
  - PUT  /api/turnos/:id
*/
app.get("/api/turnos", async (req, res) => {
  try {
    const items = await Turno.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar turnos" });
  }
});

app.post("/api/turnos", async (req, res) => {
  try {
    const data = req.body || {};
    // asegúrate que el modelo tenga los campos esperados: numero, box, estado
    const nuevo = new Turno({
      numero: data.numero,
      box: data.box,
      estado: data.estado || "pendiente",
      // otros campos que tu modelo requiera
    });
    const saved = await nuevo.save();
    emitirActualizacion("nuevo", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear turno" });
  }
});

app.put("/api/turnos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body || {};
    const updated = await Turno.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Turno no encontrado" });
    emitirActualizacion("update", updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar turno" });
  }
});

// Conectar a Mongo y levantar server
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Mongo conectado");
    server.listen(PORT, () => {
      console.log(`Backend listo en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error conectando Mongo:", err);
    process.exit(1);
  });

module.exports = { app, server, io };
