const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`+ MongoDB Conectado con éxito: ${conn.connection.host}`);
  } catch (error) {
    console.error(`X Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;