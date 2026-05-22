const mongoose = require('mongoose');
const Stock = require('../models/stock');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) {
      if (!mongoose.Types.ObjectId.isValid(req.query.product)) {
        return res.status(400).json({ status: 'error', message: 'ID de producto no válido' });
      }
      filter.producto = req.query.product;
    }

    if (req.query.branch) {
      if (!mongoose.Types.ObjectId.isValid(req.query.branch)) {
        return res.status(400).json({ status: 'error', message: 'ID de sucursal no válido' });
      }
      filter.sucursal = req.query.branch;
    }

    const query = Stock.find(filter)
      .populate('producto', 'sku nombre categoria')
      .populate('sucursal', 'nombre ubicacion');

    const data = await query;

    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { getAll };
