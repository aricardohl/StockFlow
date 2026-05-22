const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  producto:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  origen:       { type: mongoose.Schema.Types.ObjectId, ref: 'Branch',  default: null },
  destino:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch',  default: null },
  tipo:         { type: String, enum: ['ENTRADA', 'SALIDA', 'TRANSACCION_SUC'], required: true },
  cantidad:     { type: Number, required: true, min: 1 },
  estado:       { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  intentos:     { type: Number, default: 0 },
  mensajeError: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Movement', movementSchema);