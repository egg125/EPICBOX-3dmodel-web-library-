const express = require('express');
const { getAllUsers, deleteUser, setAdminRole } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Solo admins pueden ver todos los usuarios
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

// Solo admins pueden cambiar roles
router.patch('/users/:id/role', authMiddleware, adminMiddleware, setAdminRole);

module.exports = router;
