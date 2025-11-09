// commentsController.js

const Comment = require('../models/Comment');
const Asset = require('../models/Asset');
const User = require('../models/User');

// 🟢 Crear un comentario y actualizar el Asset relacionado
const createComment = async (req, res) => {
  try {
    const { assetId, comentario, puntuacion } = req.body.assetId ? req.body : req.query;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset no encontrado' });

    const comment = new Comment({
      user: req.user.id,
      asset: assetId,
      comentario,
      puntuacion,
    });

    await comment.save();

    asset.comentarios.push(comment._id);
    await asset.save();

    await comment.populate('user', 'nombre email');

    res.status(201).json({
      message: 'Comentario creado y vinculado al asset',
      comment: {
        id: comment._id,
        user: {
          nombre: comment.user.nombre,
          email: comment.user.email,
        },
        asset: comment.asset,
        comentario: comment.comentario,
        puntuacion: comment.puntuacion,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      updatedAsset: {
        _id: asset._id,
        totalComentarios: asset.comentarios.length
      }
    });

  } catch (error) {
    console.error('Error en createComment:', error);
    res.status(500).json({ message: 'Error al crear el comentario', error });
  }
};

// 🔍 Obtener un comentario por su ID
const getCommentById = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id).populate('user', 'nombre email');
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });

    res.json(comment);
  } catch (error) {
    console.error('Error al obtener el comentario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 📚 Obtener todos los comentarios de un asset
const getCommentsByAsset = async (req, res) => {
  try {
    const { assetId } = req.params;

    const comments = await Comment.find({ asset: assetId })
      .populate('user', 'nombre email');

    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los comentarios', error });
  }
};

// ❌ Eliminar un comentario
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este comentario' });
    }

    await comment.remove();
    res.status(200).json({ message: 'Comentario eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el comentario', error });
  }
};

module.exports = {
  createComment,
  getCommentById,
  getCommentsByAsset,
  deleteComment
};
