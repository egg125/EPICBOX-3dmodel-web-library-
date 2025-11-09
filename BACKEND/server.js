// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Usa la función connectDB desde config/db
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const commentRoutes = require('./routes/commentRoutes');  // Nueva ruta
const cartRoutes = require('./routes/cartRoutes');
const historialRoutes = require('./routes/historialRoutes');
const driveProxyRouter = require('./routes/driveProxy');



const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Conectar a la base de datos
connectDB(); // Llama a la función importada desde config/db

app.get('/', (req, res) => {
    res.send('API funcionando 🚀');
});

// Usar rutas organizadas

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use(express.static('public')); // Para servir archivos estáticos como el visor 3D
app.use('/api/comments', commentRoutes);  // Nueva ruta de comentarios
app.use('/api/cart', cartRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/drive', driveProxyRouter);

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
