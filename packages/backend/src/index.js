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
connectDB();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de prueba inicial
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Servidor de StockFlow corriendo correctamente' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/stock',    stockRoutes);
app.use('/api/movement', movementRoutes);

// Inicializar el servidor
app.listen(PORT, () => {
  console.log(`>>> Servidor escuchando en el puerto ${PORT}`);
});