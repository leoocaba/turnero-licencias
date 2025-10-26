// models/Turno.js
import mongoose from "mongoose";

const turnoSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  box: { type: Number, default: null },
  estado: { 
    type: String, 
    enum: ["pendiente", "llamando", "atendido", "perdido"], 
    default: "pendiente" 
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Turno", turnoSchema);
