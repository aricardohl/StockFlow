const Branch = require('../models/branch');

const getAll = async (req, res) => {
  try {
    const data = await Branch.find();
    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const getOne = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ status: 'error', message: 'Sucursal no encontrada' });
    }
    return res.status(200).json({ status: 'success', data: branch });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    return res.status(201).json({ status: 'success', data: branch });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: details });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) {
      return res.status(404).json({ status: 'error', message: 'Sucursal no encontrada' });
    }
    return res.status(200).json({ status: 'success', data: branch });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: details });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ status: 'error', message: 'Sucursal no encontrada' });
    }
    return res.status(200).json({ status: 'success', message: 'Sucursal eliminada exitosamente' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors: details });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
