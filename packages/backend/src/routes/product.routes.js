const { Router } = require('express');
const { getAll, getOne, create, update, remove } = require('../controllers/product.controller');

const router = Router();

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
