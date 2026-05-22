const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'name, email y password son requeridos' });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: { name: user.name, email: user.email },
    });
  } catch (error) {
  console.error('Error al registrar usuario:', error);
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'El email ya está registrado' });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updates = {};

    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'ID de usuario no válido' });
    }

    if (name) updates.name = name;
    if (email) updates.email = email;

    if (password) {
      // Creating a temporary document to trigger the pre-save hook
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
      }
      user.name = updates.name ?? user.name;
      user.email = updates.email ?? user.email;
      user.password = password;
      await user.save();

      return res.status(200).json({
        status: 'success',
        data: { id: user._id, name: user.name, email: user.email },
      });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'El email ya está registrado' });
    }
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'ID de usuario no válido' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { register, update, remove };
