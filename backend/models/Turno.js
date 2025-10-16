import mongoose from "mongoose";

const turnoSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  box: { type: Number, required: false },
  estado: { type: String, enum: ["esperando", "llamando", "atendido", "ausente"], default: "esperando" },
  horaCreacion: { type: Date, default: Date.now }
});

export default mongoose.model("Turno", turnoSchema);
