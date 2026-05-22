const Movement = require('../models/movement');
const Stock    = require('../models/stock');
const { getChannel } = require('../config/rabbitmq');

const QUEUE = process.env.RABBITMQ_QUEUE_MOVEMENTS;
const MAX_ATTEMPTS = 2;

async function processMessage(msg, channel) {
  const { movementId, attempts = 0 } = JSON.parse(msg.content.toString());

  const movement = await Movement.findById(movementId);
  if (!movement) {
    // Mensaje huérfano: ack y descartar
    channel.ack(msg);
    return;
  }

  try {
    const { tipo, producto, origen, destino, cantidad } = movement;

    if (tipo === 'ENTRADA') {
      await Stock.findOneAndUpdate(
        { producto, sucursal: destino },
        { $inc: { cantidad } },
        { upsert: true, new: true }
      );
    } else if (tipo === 'SALIDA') {
      const result = await Stock.findOneAndUpdate(
        { producto, sucursal: origen, cantidad: { $gte: cantidad } },
        { $inc: { cantidad: -cantidad } },
        { new: true }
      );
      if (!result) throw new Error('Stock insuficiente en la sucursal origen');
    } else if (tipo === 'TRANSACCION_SUC') {
      const result = await Stock.findOneAndUpdate(
        { producto, sucursal: origen, cantidad: { $gte: cantidad } },
        { $inc: { cantidad: -cantidad } },
        { new: true }
      );
      if (!result) throw new Error('Stock insuficiente en la sucursal origen');
      await Stock.findOneAndUpdate(
        { producto, sucursal: destino },
        { $inc: { cantidad } },
        { upsert: true, new: true }
      );
    }

    await Movement.findByIdAndUpdate(movementId, { estado: 'processed' });
    channel.ack(msg);
    console.log(`[Worker] Movimiento ${movementId} procesado exitosamente.`);
  } catch (err) {
    console.error(`[Worker] Error al procesar movimiento ${movementId} (intento ${attempts + 1}):`, err.message);

    if (attempts < MAX_ATTEMPTS) {
      // Reintentar: ack el mensaje actual, incrementar intentos y re-encolar
      channel.ack(msg);
      await Movement.findByIdAndUpdate(movementId, { $inc: { intentos: 1 } });
      channel.sendToQueue(
        QUEUE,
        Buffer.from(JSON.stringify({ movementId, attempts: attempts + 1 })),
        { persistent: true }
      );
      console.log(`[Worker] Movimiento ${movementId} re-encolado (intento ${attempts + 1}/${MAX_ATTEMPTS}).`);
    } else {
      // Reintentos agotados: marcar como fallido
      await Movement.findByIdAndUpdate(movementId, {
        estado: 'failed',
        mensajeError: err.message,
      });
      channel.ack(msg);
      console.log(`[Worker] Movimiento ${movementId} marcado como FAILED: ${err.message}`);
    }
  }
}

async function startWorker() {
  const channel = getChannel();
  if (!channel) throw new Error('RabbitMQ channel not available for worker');

  // Procesar un mensaje a la vez para controlar concurrencia
  channel.prefetch(1);

  await channel.consume(QUEUE, (msg) => {
    if (msg !== null) processMessage(msg, channel);
  }, { noAck: false });

  console.log(`[Worker] Escuchando cola "${QUEUE}"...`);
}

module.exports = { startWorker };
