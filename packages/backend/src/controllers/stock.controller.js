const Stock = require('../models/stock');

const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.producto = req.query.product;
    if (req.query.branch)  filter.sucursal = req.query.branch;

    if(mongoose.Types.ObjectId.isValid(req.query.product)) {
      return res.status(400).json({ status: 'error', message: 'ID de producto no válido' });
    }

    if(mongoose.Types.ObjectId.isValid(req.query.branch)) {
      return res.status(400).json({ status: 'error', message: 'ID de sucursal no válido' });
    }

    const data = await Stock.find(filter)
      .populate('producto', 'sku nombre')
      .populate('sucursal', 'nombre ubicacion');

    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { getAll };
