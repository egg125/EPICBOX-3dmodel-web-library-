const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
