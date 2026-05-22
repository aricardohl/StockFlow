const Product = require('../models/product');

const getAll = async (req, res) => {
  try {
    const data = await Product.find();
    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const getOne = async (req, res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'ID de producto no válido' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: details });
    }

    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'El SKU ya existe' });
    }

    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
      if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ status: 'error', message: 'ID de producto no válido' });
      }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'El SKU ya existe' });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {

    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'ID de producto no válido' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    return res.status(200).json({ status: 'success', message: 'Producto eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
