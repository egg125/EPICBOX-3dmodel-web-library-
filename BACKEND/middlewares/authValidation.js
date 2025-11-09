const { check } = require('express-validator');

const validateRegister = [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Debe ser un email válido').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
];

const validateLogin = [
    check('email', 'Debe ser un email válido').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
];

module.exports = { validateRegister, validateLogin };
