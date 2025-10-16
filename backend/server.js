// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // en dev: permitir todo. En prod restringir al frontend.
});

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // para test client

// --- Mongoose / modelo Turno (simple) ---
const turnoSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  box: { type: Number, default: null },
  estado: { type: String, default: "pendiente" }, // pendiente, llamando, atendido, perdido
  createdAt: { type: Date, default: Date.now }
});
const Turno = mongoose.model("Turno", turnoSchema);

// --- Conexión a Mongo ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  // opciones si necesitás
})
.then(()=> console.log("✅ Conectado a MongoDB"))
.catch(err => {
  console.error("❌ Error conectando a MongoDB:", err);
  process.exit(1);
});

// --- Rutas REST básicas ---
app.get("/", (req, res) => res.send("Turnero backend OK 🚀"));

app.get("/api/turnos", async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const turnos = await Turno.find().sort({ createdAt: -1 }).limit(limit).exec();
  res.json(turnos);
});

app.post("/api/turnos", async (req, res) => {
  try {
    const { numero, box, estado } = req.body;
    const t = new Turno({ numero, box, estado });
    await t.save();

    // emitir a todos los clientes conectados
    io.emit("turno_actualizado", { action: "nuevo", turno: t });
    return res.status(201).json(t);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error creando turno" });
  }
});

// endpoint para actualizar un turno y emitir (ej. admin)
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
  console.log("🟢 Cliente socket conectado:", socket.id);

  socket.on("ping", (d)=> socket.emit("pong", d));

  // si un admin manda un evento desde socket (opcional)
  socket.on("admin:llamar", async (payload) => {
    // payload: { numero, box }
    const t = new Turno({ numero: payload.numero, box: payload.box, estado: "llamando" });
    await t.save();
    io.emit("turno_actualizado", { action: "nuevo", turno: t });
  });

  socket.on("disconnect", ()=> {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// --- Levantar server ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
