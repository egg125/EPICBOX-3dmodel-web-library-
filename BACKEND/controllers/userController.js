const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El usuario ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ nombre, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Usuario registrado correctamente', token });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el usuario", error });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Buscar al usuario por su email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }
  
      // Comparar la contraseña ingresada con la guardada en la base de datos
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }
  
      // Generar el token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Responder con el token y los datos relevantes del usuario
      res.json({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          _id: user._id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          fecha_registro: user.fecha_registro
        }
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ message: 'Error en la autenticación' });
    }
  };
  

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Oculta la contraseña
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

const setAdminRole = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.role = 'admin';
        await user.save();

        res.status(200).json({ message: 'Usuario ahora es administrador', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el rol', error });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id; // ID del usuario autenticado
        const requester = await User.findById(requesterId);

        if (!requester) {
            return res.status(403).json({ message: "Usuario no autorizado" });
        }

        if (requester.role !== "admin" && requesterId !== id) {
            return res.status(403).json({ message: "No tienes permiso para eliminar este usuario" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: "Usuario eliminado correctamente" });

    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el usuario", error });
    }
};

// Función para obtener el perfil del usuario autenticado
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // No enviamos la contraseña
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user); 
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil', error });
    }
};

const updateProfile = async (req, res) => {
    const { nombre, email, password } = req.body;
  
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  
      user.nombre = nombre || user.nombre;
      user.email = email || user.email;
  
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
  
      await user.save();
      res.status(200).json({ message: "Perfil actualizado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  };
  

module.exports = { registerUser, loginUser, getAllUsers, setAdminRole, deleteUser, getProfile, updateProfile, getUserById };
