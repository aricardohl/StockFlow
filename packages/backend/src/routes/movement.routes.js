const { Router } = require('express');
const { create, getAll, report, getOne } = require('../controllers/movement.controller');

const router = Router();

router.post('/',       create);
router.get('/',        getAll);
router.get('/report',  report);  // Debe ir ANTES de /:id para que Express no lo interprete como parámetro
router.get('/:id',     getOne);

module.exports = router;
