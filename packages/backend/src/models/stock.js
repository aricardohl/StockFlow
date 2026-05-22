const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  producto:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sucursal:  { type: mongoose.Schema.Types.ObjectId, ref: 'Branch',  required: true },
  cantidad:  { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

// Un registro de stock único por combinación producto+sucursal
stockSchema.index({ producto: 1, sucursal: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);