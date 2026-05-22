const { Router } = require('express');
const { register, update, remove } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post('/', register);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, remove);

module.exports = router;
