// routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const { uploadAssetFiles } = require('../middlewares/upload');
const assetController = require('../controllers/assetController');
const authMiddleware = require('../middlewares/authMiddleware');
const { assetSchema } = require('../middlewares/assetValidation');

// Ruta para crear un asset (requiere autenticación)
router.post('/', 
  authMiddleware, // Cambiado de authMiddleware.verifyToken a solo authMiddleware
  uploadAssetFiles,
  assetController.createAsset
);

// Ruta para obtener todos los assets
router.get('/', assetController.getAllAssets);

router.get('/user/:userId', assetController.getAssetsByUserId);

router.get('/download/:id', authMiddleware, assetController.downloadAsset);
// Ruta para obtener un asset por ID
router.get('/:id', assetController.getAssetById);

// Ruta para eliminar un asset (requiere autenticación)
router.delete('/:id', 
  authMiddleware, // Cambiado de authMiddleware.verifyToken a solo authMiddleware 
  assetController.deleteAsset
);
// Ruta para actualizar la valoración de un asset
router.put('/:assetId/rating', authMiddleware, assetController.updateAssetRating);

// Ruta para añadir un comentario a un asset (requiere autenticación)
router.post('/:assetId/comentarios', 
  authMiddleware, // Cambiado de authMiddleware.verifyToken a solo authMiddleware
  assetController.addCommentToAsset
);

module.exports = router;