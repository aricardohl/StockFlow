require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const branchRoutes = require('./routes/branch.routes');
const stockRoutes    = require('./routes/stock.routes');
const movementRoutes = require('./routes/movement.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB Atlas
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`>>> Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Fallo al conectar a MongoDB. Abortando arranque.', err);
    process.exit(1);
  }
}


// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/stock',    stockRoutes);
app.use('/api/movement', movementRoutes);

startServer();