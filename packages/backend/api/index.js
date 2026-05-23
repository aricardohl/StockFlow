const connectDB = require('../src/config/db');
const app = require('../src/app');

// Reutiliza la conexión MongoDB entre invocaciones "warm"
let dbConnected = false;

module.exports = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  return app(req, res);
};
