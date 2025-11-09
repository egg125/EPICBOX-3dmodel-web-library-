// controllers/assetController.js
const Asset = require('../models/Asset');
const User = require('../models/User');
const Comment = require('../models/Comment'); // Añadido modelo de comentario
const fs = require('fs');
const path = require('path');
const { 
  uploadFileToDrive, 
  createDriveFolder,
  deleteFromDrive,
  downloadFileFromDrive, 
  listFilesInFolder,
  ASSETS_FOLDER_ID
} = require('../helpers/googleDrive');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Verificar si el modelo ya existe antes de definirlo
const assetSchema = new Schema({
  titulo: { type: String, required: true },
  tipo: { type: String, required: true },
  descripcion: { type: String, required: true },
  imagen_descriptiva: { type: [String], default: [] },
  archivo: { type: [String], required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comentarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });


// Esta línea debe ir *después* de importar mongoose y definir el esquema
module.exports = mongoose.models.Asset || mongoose.model('Asset', assetSchema);

const downloadAsset = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el asset por ID
    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset no encontrado' });
    }

    // Obtener folderId del asset
    let folderId = asset.drive_folder_id;
    if (!folderId) {
      const folderName = `asset-${asset.titulo}-${asset._id}`;
      folderId = await findFolderByName(folderName, ASSETS_FOLDER_ID);
      if (!folderId) {
        return res.status(400).json({ message: 'No se encontró una carpeta asociada en Google Drive para este asset' });
      }
    }

    // Listar archivos en la carpeta del asset
    const filesInFolder = await listFilesInFolder(folderId);

    // Descargar todos los archivos de la carpeta
    const tmpDir = path.join(__dirname, '../tmp', uuidv4());
    fs.mkdirSync(tmpDir, { recursive: true });

    const assetFiles = [];
    for (const file of filesInFolder) {
      const filePath = path.join(tmpDir, file.name);
      await downloadFileFromDrive(file.id, filePath);
      assetFiles.push({ filePath, nameInZip: file.name });
    }

    if (assetFiles.length === 0) {
      return res.status(400).json({ message: 'No se encontraron archivos para descargar en la carpeta del asset' });
    }

    // Si hay un solo archivo, enviarlo directamente
    if (assetFiles.length === 1) {
      const singleFile = assetFiles[0];
      res.setHeader('Content-Disposition', `attachment; filename="${singleFile.nameInZip}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.sendFile(singleFile.filePath, (err) => {
        if (err) {
          console.error('Error enviando archivo individual:', err);
          return res.status(500).json({ message: 'Error al enviar archivo individual' });
        }
        fs.rmSync(tmpDir, { recursive: true, force: true });
      });
    }

    // Crear un archivo ZIP con todos los archivos del asset
    const zipPath = path.join(tmpDir, `${asset.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    assetFiles.forEach(file => archive.file(file.filePath, { name: file.nameInZip }));
    await archive.finalize();

    output.on('close', () => {
      res.setHeader('Content-Disposition', `attachment; filename="${asset.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip"`);
      res.setHeader('Content-Type', 'application/zip');
      res.sendFile(zipPath, (err) => {
        if (err) {
          console.error('Error enviando archivo ZIP:', err);
          return res.status(500).json({ message: 'Error al enviar archivo ZIP' });
        }
        fs.rmSync(tmpDir, { recursive: true, force: true });
      });
    });
  } catch (error) {
    console.error('Error en downloadAsset:', error);
    res.status(500).json({ message: 'Error al descargar el asset', error: error.message });
  }
};

const createAsset = async (req, res) => {
  const { titulo, tipo, descripcion } = req.body;
  let etiquetas = req.body.etiquetas || [];
  const usuario_id = req.user.id;

  try {
    console.log('Inicio de createAsset:', { titulo, tipo });

    if (typeof etiquetas === 'string') {
      etiquetas = etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    if (!req.files?.archivo) {
      return res.status(400).json({ message: 'Debes subir al menos un archivo del modelo' });
    }

    console.log('Archivos recibidos:', {
      archivo: req.files.archivo ? (Array.isArray(req.files.archivo) ? req.files.archivo.length : 1) : 0,
      imagen: req.files.imagen_descriptiva ? (Array.isArray(req.files.imagen_descriptiva) ? req.files.imagen_descriptiva.length : 1) : 0
    });

    const user = await User.findById(usuario_id);
    if (!user) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ message: 'El usuario no existe' });
    }

    // 1. Crear asset provisional vacío para obtener su _id
    const nuevoAsset = new Asset({
      titulo,
      tipo,
      descripcion,
      archivo: [],
      imagen_descriptiva: [],
      usuario_id,
      etiquetas,
    });
    await nuevoAsset.save();

    // 2. Crear carpeta en Drive usando el _id del asset
    const driveFolderName = `asset-${titulo}-${nuevoAsset._id}`;
    console.log(`Creando carpeta en Drive: ${driveFolderName} dentro de ${ASSETS_FOLDER_ID}`);
    const folderId = await createDriveFolder(driveFolderName);
    console.log(`Carpeta creada en Drive con ID: ${folderId}`);

    // 3. Subir archivos principales
    const archivosEnDrive = [];
    const archivosArray = Array.isArray(req.files.archivo) ? req.files.archivo : [req.files.archivo];

    console.log(`Subiendo ${archivosArray.length} archivos principales...`);
    for (const file of archivosArray) {
      try {
        console.log(`Subiendo archivo: ${file.originalname} (${file.path})`);
        const uploaded = await uploadFileToDrive(file.path, file.originalname, folderId);
        console.log(`Archivo subido con éxito. URL: ${uploaded.publicUrl}`);
        archivosEnDrive.push(uploaded.publicUrl);
      } catch (error) {
        console.error(`Error al subir archivo ${file.originalname}:`, error);
        throw error;
      } finally {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Archivo temporal eliminado: ${file.path}`);
        }
      }
    }

    // 4. Subir imágenes descriptivas
    const imagenesDescriptivas = [];
    if (req.files.imagen_descriptiva) {
      const imagenesArray = Array.isArray(req.files.imagen_descriptiva)
        ? req.files.imagen_descriptiva
        : [req.files.imagen_descriptiva];

      console.log(`Subiendo ${imagenesArray.length} imágenes descriptivas...`);
      for (const file of imagenesArray) {
        try {
          console.log(`Subiendo imagen: ${file.originalname}`);
          const uploaded = await uploadFileToDrive(file.path, file.originalname, folderId);
          console.log(`Imagen subida con éxito. ID: ${uploaded.id}`);
          imagenesDescriptivas.push(uploaded.id); // <-- SOLO EL ID
        } catch (error) {
          console.error(`Error al subir imagen ${file.originalname}:`, error);
        } finally {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Imagen temporal eliminada: ${file.path}`);
          }
        }
      }
    }

    // 5. Actualizar asset con carpeta e urls de archivos
    nuevoAsset.archivo = archivosEnDrive;
    nuevoAsset.imagen_descriptiva = imagenesDescriptivas;
    nuevoAsset.drive_folder_id = folderId;

    await nuevoAsset.save();
    console.log(`Asset actualizado y guardado con ID: ${nuevoAsset._id}`);

    res.status(201).json({
      message: 'Asset creado correctamente',
      asset: nuevoAsset
    });

  } catch (err) {
    console.error('Error en createAsset:', err);
    cleanupTempFiles(req.files);
    res.status(500).json({
      message: 'Error al crear el asset',
      error: err.message
    });
  }
};


// Función de utilidad para limpiar archivos temporales
const cleanupTempFiles = (files) => {
  if (!files) return;
  
  // Limpieza de archivos principales
  if (files.archivo) {
    const archivos = Array.isArray(files.archivo) ? files.archivo : [files.archivo];
    archivos.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
  }
  
  // Limpieza de imágenes
  if (files.imagen_descriptiva) {
    const imagenes = Array.isArray(files.imagen_descriptiva) ? files.imagen_descriptiva : [files.imagen_descriptiva];
    imagenes.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
  }
};

// 🔹 Obtener todos los assets
const getAllAssets = async (req, res) => {
  try {
    const { tipo, etiqueta, usuario, limit = 10, page = 1, sort = '-fecha_subida' } = req.query;
    const skip = (page - 1) * limit;
    
    // Construir el filtro basado en los parámetros
    const filter = {};
    if (tipo) filter.tipo = tipo;
    if (etiqueta) filter.etiquetas = { $in: [etiqueta] };
    if (usuario) filter.usuario_id = usuario;
    
    // Determinar cómo ordenar
    let sortOption = { fecha_subida: -1 }; // Por defecto, más recientes primero
    if (sort === 'valoracion') {
      sortOption = { valoracion: -1 };
    } else if (sort === 'titulo') {
      sortOption = { titulo: 1 };
    }
    
    const assets = await Asset.find(filter)
      .populate('usuario_id', 'nombre email')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);
      
    const total = await Asset.countDocuments(filter);
    
    res.status(200).json({
      assets,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error en getAllAssets:', error);
    res.status(500).json({ message: 'Error al obtener los assets', error: error.message });
  }
};

// 🔹 Obtener asset por ID con comentarios
const getAssetById = async (req, res) => {
  try {
    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de asset no válido' });
    }

    // Buscar el asset por ID y poblar los datos necesarios
    const asset = await Asset.findById(req.params.id)
      .populate('usuario_id', 'nombre email') // Poblar datos del usuario
      .populate({
        path: 'comentarios',
        populate: {
          path: 'usuario_id', // Asegúrate de que este campo sea correcto
          select: 'nombre email',
        },
      });

    // Verificar si el asset existe
    if (!asset) {
      return res.status(404).json({ message: 'Asset no encontrado' });
    }

    res.status(200).json(asset);
  } catch (error) {
    console.error('Error en getAssetById:', error);
    res.status(500).json({ message: 'Error al obtener el asset', error: error.message });
  }
};
// Actualizar la valoración de un asset
const updateAssetRating = async (req, res) => {
  const { assetId } = req.params; // ID del asset a actualizar
  const { valoracion } = req.body; // Nueva valoración

  try {
    // Verificar si el asset existe
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset no encontrado' });
    }

    // Actualizar la valoración
    asset.valoracion = valoracion;
    await asset.save();

    res.status(200).json({ message: 'Valoración actualizada correctamente', asset });
  } catch (error) {
    console.error('Error al actualizar la valoración:', error);
    res.status(500).json({ message: 'Error al actualizar la valoración', error: error.message });
  }
};
// 🔹 Añadir comentario a un asset
const addCommentToAsset = async (req, res) => {
  const { assetId } = req.params;
  const { comentario, puntuacion } = req.body;
  const usuario_id = req.user.id; // Asumiendo autenticación

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset no encontrado' });

    // Crear y añadir el comentario directamente en el documento del asset
    const nuevoComentario = {
      usuario_id,
      comentario,
      puntuacion,
      fecha_comentario: new Date()
    };

    asset.comentarios.push(nuevoComentario);
    
    // Recalcular la valoración promedio
    if (puntuacion) {
      const totalPuntuaciones = asset.comentarios.reduce((sum, c) => 
        sum + (c.puntuacion || 0), 0);
      asset.valoracion = totalPuntuaciones / asset.comentarios.length;
    }
    
    await asset.save();

    res.status(200).json({ 
      message: 'Comentario agregado correctamente', 
      asset 
    });
  } catch (error) {
    console.error('Error en addCommentToAsset:', error);
    res.status(500).json({ 
      message: 'Error al agregar el comentario', 
      error: error.message 
    });
  }
};

// 🔹 Eliminar un asset y sus archivos en Drive
const deleteAsset = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Asumiendo autenticación

  try {
    const asset = await Asset.findById(id);
    if (!asset) return res.status(404).json({ message: 'Asset no encontrado' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Verificar permisos
    if (user.rol !== 'admin' && asset.usuario_id.toString() !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este asset' });
    }

    // Eliminamos la carpeta de Drive si existe el ID
    if (asset.drive_folder_id) {
      try {
        await deleteFromDrive(asset.drive_folder_id);
        console.log(`Carpeta de Drive eliminada: ${asset.drive_folder_id}`);
      } catch (driveError) {
        console.error(`Error eliminando carpeta de Drive: ${driveError.message}`);
        // Continuamos con la eliminación del asset aunque falle Drive
      }
    }

    // Eliminamos el asset de MongoDB
    await Asset.findByIdAndDelete(id);
    console.log(`Asset eliminado de la base de datos: ${id}`);
    
    res.status(200).json({ message: 'Asset eliminado correctamente' });

  } catch (error) {
    console.error('Error en deleteAsset:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el asset', 
      error: error.message 
    });
  }
};


const getAssetsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Buscando assets para usuario:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    const assets = await Asset.find({ usuario_id: userId });
    console.log(`Encontrados ${assets.length} assets`);

    res.status(200).json(assets);
  } catch (error) {
    console.error("Error al obtener los assets del usuario:", error);
    res.status(500).json({ message: "Error al obtener los assets del usuario." });
  }
};


// Obtener todos los comentarios
const getAllComments = async (req, res) => {
  try {
    // Buscar todos los comentarios en la base de datos
    const comments = await Comment.find().populate('user', 'nombre email'); // Puedes poblar los datos del usuario, si es necesario
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error al obtener todos los comentarios:', error);
    res.status(500).json({ message: 'Error al obtener los comentarios', error });
  }
};


module.exports = {
  createAsset,
  getAllAssets,
  getAssetById,
  deleteAsset,
  addCommentToAsset,
  getAllComments,
  getAssetsByUserId,
  updateAssetRating,
  downloadAsset,
};