#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { connectRabbitMQ } = require('../src/config/rabbitmq');
const Movement = require('../src/models/movement');
const Product = require('../src/models/product');
const Branch = require('../src/models/branch');

async function ensureSampleData() {
  let products = await Product.find().limit(50);
  if (!products || products.length === 0) {
    const toCreate = Array.from({ length: 5 }).map((_, i) => ({
      sku: `SKU-${Date.now()}-${i}`,
      nombre: `Producto ${i + 1}`,
      precio: (i + 1) * 10,
      categoria: 'GEN',
    }));
    products = await Product.insertMany(toCreate);
    console.log(`Seeded ${products.length} products`);
  }

  let branches = await Branch.find().limit(50);
  if (!branches || branches.length === 0) {
    const toCreate = [
      { nombre: 'Sucursal A', ubicacion: 'Ciudad A' },
      { nombre: 'Sucursal B', ubicacion: 'Ciudad B' },
      { nombre: 'Sucursal C', ubicacion: 'Ciudad C' },
    ];
    branches = await Branch.insertMany(toCreate);
    console.log(`Seeded ${branches.length} branches`);
  }

  return { products, branches };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectDB();

  const rabbit = await connectRabbitMQ();
  if (!rabbit || !rabbit.channel) {
    console.error('No se pudo conectar a RabbitMQ. Revisa env vars.');
    process.exit(1);
  }
  const channel = rabbit.channel;
  const QUEUE = process.env.RABBITMQ_QUEUE_MOVEMENTS;

  const { products, branches } = await ensureSampleData();

  const tipos = ['ENTRADA', 'SALIDA', 'TRANSACCION_SUC'];
  const movementsToInsert = [];

  for (let i = 0; i < 50; i++) {
    const producto = products[randomInt(0, products.length - 1)]._id;
    const tipo = tipos[randomInt(0, tipos.length - 1)];
    let origen = null;
    let destino = null;

    if (tipo === 'TRANSACCION_SUC') {
      const a = branches[randomInt(0, branches.length - 1)]._id;
      let b = branches[randomInt(0, branches.length - 1)]._id;
      if (a.toString() === b.toString()) {
        const alt = branches.find((x) => x._id.toString() !== a.toString());
        b = alt ? alt._id : null;
      }
      origen = a;
      destino = b;
    } else if (tipo === 'ENTRADA') {
      destino = branches[randomInt(0, branches.length - 1)]._id;
    } else {
      origen = branches[randomInt(0, branches.length - 1)]._id;
    }

    const cantidad = randomInt(1, 100);

    movementsToInsert.push({
      producto,
      origen,
      destino,
      tipo,
      cantidad,
      estado: 'pending',
      intentos: 0,
      mensajeError: null,
    });
  }

  const created = await Movement.insertMany(movementsToInsert);
  console.log(`Creado(s) ${created.length} movimientos en la BD.`);

  for (const mv of created) {
    const payload = { movementId: mv._id.toString(), attempts: 0 };
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
  }
  console.log(`Publicados ${created.length} mensajes en la cola ${QUEUE}.`);

  try {
    await channel.close();
    if (rabbit.connection) await rabbit.connection.close();
  } catch (e) {
    // ignore
  }

  await mongoose.connection.close();
  console.log('Terminado.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
