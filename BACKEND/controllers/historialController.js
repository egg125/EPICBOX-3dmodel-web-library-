const DownloadHistory = require('../models/DownloadHistory');

const getHistorial = async (req, res) => {
  try {
    const historial = await DownloadHistory
      .find({ usuario_id: req.user.id })
      .populate('assets')
      .sort({ fecha: -1 });

    res.status(200).json(historial);
  } catch (err) {
    console.error('Error al obtener el historial:', err);
    res.status(500).json({ message: 'Error al obtener el historial de descargas', err });
  }
};

module.exports = { getHistorial };
