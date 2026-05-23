#!/usr/bin/env node
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Movement = require('../src/models/movement');

async function setAllProcessed() {
  await connectDB();
  try {
    const res = await Movement.updateMany({}, { $set: { estado: 'processed' } });
    const matched = res.matchedCount ?? res.n ?? 0;
    const modified = res.modifiedCount ?? res.nModified ?? 0;
    console.log(`Movimientos encontrados: ${matched}`);
    console.log(`Movimientos modificados: ${modified}`);
  } catch (err) {
    console.error('Error actualizando movimientos:', err);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  setAllProcessed();
}
