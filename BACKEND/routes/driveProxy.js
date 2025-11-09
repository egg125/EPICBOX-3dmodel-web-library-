// routes/driveProxy.js
const express = require('express');
const router = express.Router();
const driveProxyController = require('../controllers/driveProxyController');

// Ruta para servir archivos de Google Drive
router.get('/file/:fileId', driveProxyController.serveGoogleDriveFile);

module.exports = router;