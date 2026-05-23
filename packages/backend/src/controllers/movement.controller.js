const Movement = require('../models/movement');
const Product  = require('../models/product');
const Branch   = require('../models/branch');
const { getChannel } = require('../config/rabbitmq');

const POPULATE_OPTS = [
  { path: 'producto', select: 'sku nombre' },
  { path: 'origen',   select: 'nombre' },
  { path: 'destino',  select: 'nombre' },
];

// POST /api/movement
const create = async (req, res) => {
  try {
    const { producto, origen, destino, tipo, cantidad } = req.body;

    // Validación básica de campos requeridos
    if (!producto || !tipo || !cantidad) {
      return res.status(400).json({ status: 'error', message: 'producto, tipo y cantidad son requeridos' });
    }
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      return res.status(400).json({ status: 'error', message: 'cantidad debe ser un número mayor a cero' });
    }
    if (tipo === 'SALIDA' && !origen) {
      return res.status(400).json({ status: 'error', message: 'origen es requerido para tipo SALIDA' });
    }
    if (tipo === 'ENTRADA' && !destino) {
      return res.status(400).json({ status: 'error', message: 'destino es requerido para tipo ENTRADA' });
    }
    if (tipo === 'TRANSACCION_SUC' && (!origen || !destino)) {
      return res.status(400).json({ status: 'error', message: 'origen y destino son requeridos para TRANSACCION_SUC' });
    }

    // Verificar que las referencias existan
    const productoDoc = await Product.findById(producto);
    if (!productoDoc) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });

    if (origen) {
      const origenDoc = await Branch.findById(origen);
      if (!origenDoc) return res.status(404).json({ status: 'error', message: 'Sucursal origen no encontrada' });
    }
    if (destino) {
      const destinoDoc = await Branch.findById(destino);
      if (!destinoDoc) return res.status(404).json({ status: 'error', message: 'Sucursal destino no encontrada' });
    }

    const movement = await Movement.create({ producto, origen, destino, tipo, cantidad, estado: 'pending' });

    // Publicar en la cola de RabbitMQ
    const canal = getChannel();
    if (!canal) {
      return res.status(503).json({ status: 'error', message: 'Queue service unavailable' });
    }
    const queue = process.env.RABBITMQ_QUEUE_MOVEMENTS;
    canal.sendToQueue(
      queue,
      Buffer.from(JSON.stringify({ movementId: movement._id })),
      { persistent: true }
    );

    // 202 Accepted: movimiento encolado para procesamiento asíncrono
    return res.status(202).json({
      status: 'success',
      message: 'Movimiento en cola',
      data: { id: movement._id, estado: movement.estado },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// GET /api/movement?status=&branch=
const getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.estado = req.query.status;
    if (req.query.branch) {
      filter.$or = [{ origen: req.query.branch }, { destino: req.query.branch }];
    }

    const data = await Movement.find(filter)
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// GET /api/movement/report?startDate=&endDate=
const report = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'startDate y endDate son requeridos' });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999); // Incluir todo el día final

    const data = await Movement.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:           { tipo: '$tipo', sucursal: '$origen' },
          totalMovimientos: { $sum: 1 },
          cantidadTotal:    { $sum: '$cantidad' },
        },
      },
      {
        $lookup: {
          from:         'branches',
          localField:   '_id.sucursal',
          foreignField: '_id',
          as:           'sucursalInfo',
        },
      },
      { $unwind: { path: '$sucursalInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:              0,
          tipo:             '$_id.tipo',
          sucursal:         { $ifNull: ['$sucursalInfo.nombre', 'N/A'] },
          totalMovimientos: 1,
          cantidadTotal:    1,
        },
      },
      { $sort: { tipo: 1, sucursal: 1 } },
    ]);

    return res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// GET /api/movement/:id
const getOne = async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id).populate(POPULATE_OPTS);
    if (!movement) {
      return res.status(404).json({ status: 'error', message: 'Movimiento no encontrado' });
    }
    return res.status(200).json({ status: 'success', data: movement });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

module.exports = { create, getAll, report, getOne };
