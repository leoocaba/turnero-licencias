// models/Turno.js
const mongoose = require('mongoose');

const TurnoSchema = new mongoose.Schema({
  numero: { type: String, required: true },
  box: { type: Number, required: false },
  estado: { type: String, default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Turno', TurnoSchema);
