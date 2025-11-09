const express = require('express');
const { registerUser, loginUser, getAllUsers, deleteUser,getUserById, } = require('../controllers/userController');
const { validateRegister, validateLogin } = require('../validations/authValidation'); 
const authMiddleware = require('../middlewares/authMiddleware');


const router = express.Router();

router.get('/', authMiddleware, getAllUsers); // Solo usuarios autenticados pueden ver la lista
router.get('/:id', authMiddleware, getUserById); // Ver un usuario específico
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.delete('/:id', authMiddleware, deleteUser); // Solo el propietario o un admin pueden borrar

module.exports = router;
