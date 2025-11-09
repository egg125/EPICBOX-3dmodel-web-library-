// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarse de que exista la carpeta uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Se guardan temporalmente en la carpeta uploads
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único para evitar colisiones
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, fileName);
  }
});

// Filtrado de archivos
const fileFilter = (req, file, cb) => {
  // Lista de extensiones permitidas
  const allowedExtensions = [
    // Imágenes
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    // Modelos 3D
    '.obj', '.fbx', '.glb', '.gltf', '.blend', '.dae', '.stl', '.3ds',
    // Audio
    '.mp3', '.wav', '.ogg', '.flac',
    // Scripts
    '.js', '.ts', '.cs', '.py', '.lua', '.json',
    // Comprimidos
    '.zip', '.rar', '.7z', '.tar', '.gz',
    // Otros
    '.pdf', '.txt'
  ];

  // Obtener la extensión del archivo
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Log para depuración
  console.log(`Archivo recibido: ${file.originalname}`);
  console.log(`Extensión: ${ext}`);
  console.log(`MIME Type: ${file.mimetype}`);
  
  // Verificar si la extensión está permitida
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`), false);
  }
};

// Límites de tamaño para diferentes tipos de archivos
const LIMITS = {
  // Imágenes: 10MB
  image: 10 * 1024 * 1024,
  // Modelos 3D: 100MB
  model: 100 * 1024 * 1024,
  // Audio: 20MB
  audio: 20 * 1024 * 1024,
  // General: 50MB
  general: 50 * 1024 * 1024
};

// Función para determinar el límite según el tipo de archivo
const getFileLimit = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Imágenes
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
    return LIMITS.image;
  }
  
  // Modelos 3D
  if (['.obj', '.fbx', '.glb', '.gltf', '.blend', '.dae', '.stl', '.3ds'].includes(ext)) {
    return LIMITS.model;
  }
  
  // Audio
  if (['.mp3', '.wav', '.ogg', '.flac'].includes(ext)) {
    return LIMITS.audio;
  }
  
  // Otros
  return LIMITS.general;
};

// Configuración principal de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.model // Máximo tamaño para cualquier archivo
  }
});

// Middleware específico para subir assets con archivos e imágenes
const uploadAssetFiles = (req, res, next) => {
  const uploadFields = upload.fields([
    { name: 'archivo', maxCount: 10 },
    { name: 'imagen_descriptiva', maxCount: 5 }
  ]);

  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'Error: Archivo demasiado grande. El tamaño máximo permitido es 100MB para modelos 3D y 10MB para imágenes.' 
        });
      }
      
      return res.status(400).json({ 
        message: `Error en la subida de archivos: ${err.message}` 
      });
    } else if (err) {
      // Error personalizado o de otro tipo
      return res.status(400).json({ 
        message: err.message || 'Error desconocido al subir los archivos' 
      });
    }
    
    // Si llegamos aquí, todo está bien
    next();
  });
};

module.exports = {
  upload,
  uploadAssetFiles
};