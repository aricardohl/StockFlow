require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startWorker } = require('./services/movementWorker');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const branchRoutes = require('./routes/branch.routes');
const stockRoutes    = require('./routes/stock.routes');
const movementRoutes = require('./routes/movement.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB Atlas y RabbitMQ
async function startServer() {
  try {
    await connectDB();
    await connectRabbitMQ();
    await startWorker();
    app.listen(PORT, () => {
      console.log(`>>> Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Fallo al iniciar el servidor. Abortando arranque.', err);
    process.exit(1);
  }
}


// Middlewares globales
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/stock',    stockRoutes);
app.use('/api/movement', movementRoutes);

startServer();