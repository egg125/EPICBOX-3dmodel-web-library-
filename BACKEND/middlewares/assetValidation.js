
const Joi = require('joi');

const assetSchema = Joi.object({
  titulo: Joi.string().required(),
  tipo: Joi.string().required(),
  descripcion: Joi.string().required(),
  usuario_id: Joi.string().required(),
  etiquetas: Joi.array().items(Joi.string()).optional()
});

module.exports = { assetSchema };
