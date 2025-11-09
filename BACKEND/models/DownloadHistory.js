// models/DownloadHistory.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const downloadHistorySchema = new Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);
