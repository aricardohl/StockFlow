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

  // Escuchar ANTES de RabbitMQ para que Render detecte el puerto inmediatamente
  app.listen(PORT, () => {
    console.log(`>>> Servidor escuchando en el puerto ${PORT}`);
  });

  // RabbitMQ en background: si falla no bloquea el servidor
  connectRabbitMQ()
    .then(async (res) => {
      if (!res) {
        console.warn('[RabbitMQ] Conexión fallida. Worker no arrancará.');
        return;
      }
      try {
        await startWorker();
      } catch (err) {
        console.warn('[RabbitMQ] Error al arrancar el worker:', err.message);
      }
    })
    .catch((err) => {
      console.warn('[RabbitMQ] No disponible, el worker no está activo:', err.message);
    });
}

startServer();