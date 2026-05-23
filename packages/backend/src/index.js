require('dotenv').config();
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startWorker } = require('./services/movementWorker');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error('Fallo al conectar a MongoDB. Abortando arranque.', err);
    process.exit(1);
  }

  // RabbitMQ es opcional: si no está disponible el servidor igual arranca
  try {
    await connectRabbitMQ();
    await startWorker();
  } catch (err) {
    console.warn('[RabbitMQ] No disponible, el worker no está activo:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`>>> Servidor escuchando en el puerto ${PORT}`);
  });
}

startServer();