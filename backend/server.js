// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Turno from "./models/Turno.js";

dotenv.config();

// --- Configuración base ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT"],
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://192.168.0.45:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());
app.use(express.static("public"));

// --- Conexión MongoDB ---
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  });

// --- Rutas REST ---
app.get("/", (req, res) => res.send("Turnero backend OK 🚀"));

app.get("/api/turnos", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const turnos = await Turno.find().sort({ createdAt: -1 }).limit(limit).exec();
    res.json(turnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error obteniendo turnos" });
  }
});

app.post("/api/turnos", async (req, res) => {
  try {
    const { numero, box, estado } = req.body;
    const t = new Turno({ numero, box, estado });
    await t.save();
    io.emit("turno_actualizado", { action: "nuevo", turno: t });
    res.status(201).json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error creando turno" });
  }
});

app.put("/api/turnos/:id", async (req, res) => {
  try {
    const t = await Turno.findByIdAndUpdate(req.params.id, req.body, { new: true });
    io.emit("turno_actualizado", { action: "update", turno: t });
    res.json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error actualizando turno" });
  }
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  socket.on("ping", (d) => socket.emit("pong", d));

  socket.on("admin:llamar", async (payload) => {
    try {
      const t = new Turno({ numero: payload.numero, box: payload.box, estado: "llamando" });
      await t.save();
      io.emit("turno_actualizado", { action: "nuevo", turno: t });
    } catch (err) {
      console.error("❌ Error en admin:llamar:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
});
