const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fecha_registro: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' } // 🔹 Por defecto es 'user'
});

module.exports = mongoose.model('User', userSchema);
