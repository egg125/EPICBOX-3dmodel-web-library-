const express = require('express');
const {
  createComment,
  getCommentById,
  getCommentsByAsset,
  deleteComment
} = require('../controllers/commentController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Crear un comentario
router.post('/', authMiddleware, createComment);

// Obtener todos los comentarios de un asset
router.get('/asset/:assetId', getCommentsByAsset);  // <-- cambiamos para que no entre en conflicto con ID de comentario

// Obtener un comentario por su ID
router.get('/:id', getCommentById);

// Eliminar un comentario
router.delete('/:commentId', authMiddleware, deleteComment);

module.exports = router;
