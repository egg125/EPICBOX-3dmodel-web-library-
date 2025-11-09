const validateSchema = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Datos inválidos', error: error.details });
    }
    next();
};

module.exports = validateSchema;
