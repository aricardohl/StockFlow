const { Router } = require('express');
const { getAll } = require('../controllers/stock.controller');

const router = Router();

router.get('/', getAll);

module.exports = router;
