const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/userController');
const { validateRegister, validateLogin } = require('../validations/authValidation');
const { validationResult } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const { updateProfile } = require('../controllers/userController');

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Aplicar validaciones antes de los controladores
router.post('/register', validateRegister, handleValidationErrors, registerUser);
router.post('/login', validateLogin, handleValidationErrors, loginUser);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
