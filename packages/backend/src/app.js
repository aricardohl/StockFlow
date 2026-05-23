require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const productRoutes  = require('./routes/product.routes');
const branchRoutes   = require('./routes/branch.routes');
const stockRoutes    = require('./routes/stock.routes');
const movementRoutes = require('./routes/movement.routes');

const app = express();

const corsOptions = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/product',  productRoutes);
app.use('/api/branch',   branchRoutes);
app.use('/api/stock',    stockRoutes);
app.use('/api/movement', movementRoutes);

module.exports = app;
