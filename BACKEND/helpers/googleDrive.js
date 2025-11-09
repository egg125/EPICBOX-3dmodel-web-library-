// helpers/googleDrive.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
require('dotenv').config();

// Configuración de autenticación para Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../config/drive-key.json'),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// ID de la carpeta assets (raíz)
const ASSETS_FOLDER_ID = '1gOBnB_YKWM75hIGUKRWNvpTlHvbrFkh8';

/**
 * Crea una carpeta en Google Drive dentro de la carpeta assets
 * @param {string} folderName - Nombre de la carpeta
 * @param {string} parentFolderId - ID de la carpeta padre (por defecto, la carpeta assets)
 * @returns {Promise<string>} - ID de la carpeta creada
 */
const createDriveFolder = async (folderName, parentFolderId = ASSETS_FOLDER_ID) => {
  try {
    const drive = google.drive({ version: 'v3', auth: await auth.getClient() });
    
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId] // Siempre especificamos un parent
    };

    const response = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    // Establecer permisos para que la carpeta sea accesible vía enlace
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creando carpeta en Drive:', error);
    throw new Error(`Error al crear la carpeta en Drive: ${error.message}`);
  }
};

/**
 * Sube un archivo a Google Drive
 * @param {string} filePath - Ruta del archivo local
 * @param {string} fileName - Nombre del archivo
 * @param {string} folderId - ID de la carpeta en Drive donde se guardará (por defecto, la carpeta assets)
 * @returns {Promise<Object>} - Información del archivo subido
 */
const uploadFileToDrive = async (filePath, fileName, folderId = ASSETS_FOLDER_ID) => {
  try {
    const drive = google.drive({ version: 'v3', auth: await auth.getClient() });
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: mime.lookup(filePath) || 'application/octet-stream',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink'
    });

    // Establecer permisos para que el archivo sea accesible vía enlace
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Obtener la URL pública del archivo
    const publicUrl = `https://drive.google.com/uc?id=${response.data.id}`;

    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
      publicUrl
    };
  } catch (error) {
    console.error('Error subiendo archivo a Drive:', error);
    throw new Error(`Error al subir archivo a Drive: ${error.message}`);
  }
};

/**
 * Elimina un archivo o carpeta de Google Drive
 * @param {string} fileId - ID del archivo o carpeta
 * @returns {Promise<void>}
 */
const deleteFromDrive = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId
    });
    return true;
  } catch (error) {
    console.error('Error eliminando archivo de Drive:', error);
    throw new Error(`Error al eliminar archivo de Drive: ${error.message}`);
  }
};

/**
 * Obtiene una lista de archivos dentro de una carpeta
 * @param {string} folderId - ID de la carpeta (por defecto, la carpeta assets)
 * @returns {Promise<Array>} - Lista de archivos
 */
const listFilesInFolder = async (folderId = ASSETS_FOLDER_ID) => {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, webContentLink, mimeType)'
    });
    return response.data.files;
  } catch (error) {
    console.error('Error listando archivos en Drive:', error);
    throw new Error(`Error al listar archivos en Drive: ${error.message}`);
  }
};

/**
 * Verifica si la carpeta assets existe y es accesible
 * @returns {Promise<boolean>} - true si la carpeta existe y es accesible
 */
const verifyAssetsFolderAccess = async () => {
  try {
    const response = await drive.files.get({
      fileId: ASSETS_FOLDER_ID,
      fields: 'id,name'
    });
    console.log(`Carpeta assets verificada: ${response.data.name} (${response.data.id})`);
    return true;
  } catch (error) {
    console.error('Error: No se puede acceder a la carpeta assets:', error);
    throw new Error(`No se puede acceder a la carpeta assets: ${error.message}`);
  }
};


/**
 * Busca una carpeta dentro de una carpeta padre por su nombre exacto
 * @param {string} folderName - Nombre de la carpeta a buscar
 * @param {string} parentFolderId - ID de la carpeta padre (por defecto, carpeta assets)
 * @returns {Promise<string|null>} - ID de la carpeta encontrada o null si no existe
 */
const findFolderByName = async (folderName, parentFolderId = ASSETS_FOLDER_ID) => {
  try {
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files.length === 0) {
      return null;
    }

    return response.data.files[0].id;
  } catch (error) {
    console.error('Error buscando carpeta en Drive:', error);
    throw new Error(`Error al buscar carpeta en Drive: ${error.message}`);
  }
};

/**
 * Descarga un archivo de Google Drive a una ruta local
 * @param {string} fileId - ID del archivo en Drive
 * @param {string} destPath - Ruta local donde se guardará el archivo
 * @returns {Promise<void>}
 */
const downloadFileFromDrive = async (fileId, destPath) => {
  const authClient = await auth.getClient();
  const driveService = google.drive({ version: 'v3', auth: authClient });

  const dest = fs.createWriteStream(destPath);

  return new Promise((resolve, reject) => {
    driveService.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
      (err, res) => {
        if (err) return reject(err);

        res.data
          .on('end', () => resolve())
          .on('error', err => reject(err))
          .pipe(dest);
      }
    );
  });
};



module.exports = {
  auth,
  createDriveFolder,
  uploadFileToDrive,
  deleteFromDrive,
  listFilesInFolder,
  verifyAssetsFolderAccess,
  ASSETS_FOLDER_ID,
  findFolderByName,
  downloadFileFromDrive  
};