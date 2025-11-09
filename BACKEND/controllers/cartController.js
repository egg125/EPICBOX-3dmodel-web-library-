const Cart = require('../models/Cart');
const Asset = require('../models/Asset');
const DownloadHistory = require('../models/DownloadHistory');
const archiver = require('archiver');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { listFilesInFolder, findFolderByName, ASSETS_FOLDER_ID, downloadFileFromDrive } = require('../helpers/googleDrive');


// --- FUNCIONES DEL CARRITO ---
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ usuario_id: req.user.id }).populate('assets');
    if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el carrito', err });
  }
};

const addToCart = async (req, res) => {
  const { assetId } = req.body;
  const userId = req.user.id;

  if (!assetId || typeof assetId !== 'string') {
    return res.status(400).json({ message: 'Asset ID inválido' });
  }

  try {
    let cart = await Cart.findOne({ usuario_id: userId });

    if (!cart) {
      cart = new Cart({
        usuario_id: userId,
        assets: [assetId],
      });
      await cart.save();
      return res.status(200).json({ message: 'Carrito creado y asset agregado' });
    }

    if (!cart.assets.includes(assetId)) {
      cart.assets.push(assetId);
      await cart.save();
      return res.status(200).json({ message: 'Asset agregado al carrito', cart });
    } else {
      return res.status(400).json({ message: 'El asset ya está en el carrito' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar al carrito', error });
  }
};

const removeFromCart = async (req, res) => {
  const { assetId } = req.params;

  try {
    const cart = await Cart.findOne({ usuario_id: req.user.id });

    if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });

    cart.assets = cart.assets.filter(id => id.toString() !== assetId);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar del carrito', err });
  }
};

// --- DESCARGA DEL CARRITO ---
const downloadCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ usuario_id: userId }).populate('assets');
    if (!cart || cart.assets.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const tmpDir = path.join(__dirname, '../tmp', uuidv4());
    fs.mkdirSync(tmpDir, { recursive: true });

    let foundAnyFiles = false;

    for (const asset of cart.assets) {
      let folderId = asset.drive_folder_id;
      if (!folderId) {
        const folderName = `asset-${asset.titulo}-${asset._id}`;
        folderId = await findFolderByName(folderName, ASSETS_FOLDER_ID);
        if (!folderId) {
          console.warn(`⚠️ No se encontró carpeta Drive para asset ${asset._id}`);
          continue;
        }
      }

      const filesInFolder = await listFilesInFolder(folderId);
      if (!filesInFolder || filesInFolder.length === 0) {
        console.warn(`⚠️ No hay archivos en la carpeta del asset ${asset._id}`);
        continue;
      }

      foundAnyFiles = true;

      const assetFolderName = asset.titulo.replace(/[^a-zA-Z0-9_-]/g, '_');
      const assetTmpDir = path.join(tmpDir, assetFolderName);
      fs.mkdirSync(assetTmpDir, { recursive: true });

      for (const file of filesInFolder) {
        const filePath = path.join(assetTmpDir, file.name);
        try {
          await downloadFileFromDrive(file.id, filePath);
          console.log(`✅ Descargado: ${file.name}`);
        } catch (err) {
          console.warn(`❌ No se pudo descargar "${file.name}" del asset ${asset._id}:`, err.message);
        }
      }
    }

    if (!foundAnyFiles) {
      return res.status(400).json({ message: 'No se encontraron archivos para descargar' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="assets.zip"');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', err => {
      console.error('❌ Error con archiver:', err);
      if (!res.headersSent) res.status(500).send({ message: 'Error al crear ZIP' });
    });

    archive.pipe(res);

    fs.readdirSync(tmpDir).forEach(folderName => {
      const folderPath = path.join(tmpDir, folderName);
      if (fs.lstatSync(folderPath).isDirectory()) {
        archive.directory(folderPath, folderName);
      }
    });

    // Cuando el ZIP termine de enviarse:
    archive.on('end', async () => {
      try {
        // Guardar historial
        const newDownload = new DownloadHistory({
          usuario_id: userId,
          assets: cart.assets.map(a => a._id),
          fecha: new Date()
        });
        await newDownload.save();
        console.log('✅ Historial de descarga guardado');

        // Vaciar carrito
        await Cart.findByIdAndUpdate(cart._id, { $set: { assets: [] } });
        console.log('✅ Carrito vaciado tras descarga completa');
      } catch (e) {
        console.error('❌ Error guardando historial o vaciando carrito tras descarga:', e);
      }
    });

    await archive.finalize();

  } catch (error) {
    console.error('🔥 Error en downloadCart:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al descargar los assets', error: error.message });
    }
  }
};




// --- EXPORTACIONES ---
module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  downloadCart,
};
