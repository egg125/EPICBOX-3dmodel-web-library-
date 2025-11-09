// controllers/driveProxyController.js
const { google } = require('googleapis');
const { auth } = require('../helpers/googleDrive');

/**
 * Sirve un archivo desde Google Drive como stream
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const serveGoogleDriveFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).send('ID del archivo no proporcionado');
    }

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    // Primero obtenemos los metadatos del archivo para conocer su tipo MIME
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType'
    });

    // Configurar encabezados de respuesta
    res.setHeader('Content-Type', fileMetadata.data.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cachear por 24 horas
    
    // Para descargas añadimos Content-Disposition
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.data.name}"`);
    }

    // Para archivos de imagen o modelos 3D, enviamos como stream directamente
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Manejar errores en el stream
    response.data.on('error', (err) => {
      console.error('Error en stream de Drive:', err);
      if (!res.headersSent) {
        res.status(500).send('Error al transmitir el archivo');
      }
    });

    // Enviar el stream al cliente
    response.data.pipe(res);
  } catch (error) {
    console.error('Error al servir archivo desde Drive:', error);
    if (!res.headersSent) {
      res.status(500).send('Error al servir el archivo desde Google Drive');
    }
  }
}
module.exports = {
  serveGoogleDriveFile,
};