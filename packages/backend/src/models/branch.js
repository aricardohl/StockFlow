const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  nombre:    { type: String, required: true, trim: true },
  ubicacion: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);