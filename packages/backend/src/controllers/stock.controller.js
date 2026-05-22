const Stock = require('../models/stock');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.producto = req.query.product;
    if (req.query.branch)  filter.sucursal = req.query.branch;

    const data = await Stock.find(filter)
      .populate('producto', 'sku nombre')
      .populate('sucursal', 'nombre');

    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { getAll };
