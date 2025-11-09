const express = require('express');
const router = express.Router();
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');


router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.delete('/remove/:assetId', authMiddleware, removeFromCart);
router.get('/download', authMiddleware, cartController.downloadCart);

module.exports = router;

