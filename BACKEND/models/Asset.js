const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  tipo: { type: String, required: true },
  fecha_subida: { type: Date, default: Date.now },
  descripcion: { type: String, required: true },
  imagen_descriptiva: [{ type: String }], // Cambiado a un array de strings
  archivo: [{ type: String, required: true }], // Cambiado a un array de strings
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  valoracion: { type: Number, default: 0 }, 
  comentarios: [{
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comentario: String,
    fecha_comentario: { type: Date, default: Date.now }
  }],
  etiquetas: [{ type: String, required: true}] // Nuevo campo para etiquetas
});

module.exports = mongoose.model('Asset', assetSchema);
