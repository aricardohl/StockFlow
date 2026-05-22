const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku:       { type: String, required: true, unique: true, trim: true },
  nombre:    { type: String, required: true, trim: true },
  precio:    { type: Number, required: true, min: 1 },
  categoria: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);