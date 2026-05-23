require('dotenv').config();
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startWorker } = require('./services/movementWorker');

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Worker] Fallo al conectar a MongoDB. Abortando.', err);
    process.exit(1);
  }

  try {
    await connectRabbitMQ();
    await startWorker();
    console.log('[Worker] Listo y escuchando mensajes.');
  } catch (err) {
    console.error('[Worker] Fallo al conectar a RabbitMQ:', err.message);
    process.exit(1);
  }
}

main();
