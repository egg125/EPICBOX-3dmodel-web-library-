const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const historialController = require('../controllers/historialController');

router.get('/', authMiddleware, historialController.getHistorial);

module.exports = router;
