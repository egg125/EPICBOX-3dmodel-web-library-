const Joi = require('joi');

const assetSchema = Joi.object({
  titulo: Joi.string().required(),
  tipo: Joi.string().required(),
  descripcion: Joi.string().required(),
  imagen_descriptiva: Joi.string().allow(''),
  usuario_id: Joi.string().hex().length(24).required()
});


module.exports = { assetSchema };
