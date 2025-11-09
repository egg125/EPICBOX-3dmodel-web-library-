import { useState } from "react";
import axios from "axios";
import "./register.css";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal"; // <-- Importa el modal


const Register = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Estado para confirmar contraseña
  const [passwordStrength, setPasswordStrength] = useState(0); // Estado para la fortaleza de la contraseña
  const [error, setError] = useState(""); // Estado para manejar errores generales
  const [emailError, setEmailError] = useState(""); // Estado para error de correo
  const [nombreError, setNombreError] = useState(""); // Estado para error de nombre
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // Estado para error de confirmación
  const [modal, setModal] = useState({ show: false, message: "" }); // Estado para el modal
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 6) strength += 1; // Longitud mínima
    if (/[A-Z]/.test(password)) strength += 1; // Al menos una letra mayúscula
    if (/[0-9]/.test(password)) strength += 1; // Al menos un número
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Al menos un carácter especial

    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
      case 1:
        return "Débil";
      case 2:
        return "Moderada";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy fuerte";
      default:
        return "Muy débil";
    }
  };

  const handleNombreChange = (e) => {
    const value = e.target.value;
    setNombre(value);

    if (!value.trim()) {
      setNombreError("El nombre es obligatorio");
    } else {
      setNombreError("");
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError("Introduce un correo válido");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value !== password) {
      setConfirmPasswordError("Las contraseñas no coinciden");
    } else {
      setConfirmPasswordError("");
    }
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Introduce un correo válido");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        nombre,
        email,
        password,
      });
     setModal({
        show: true,
        message: "Te has registrado correctamente",
      });
      // Si quieres redirigir automáticamente tras cerrar el modal:
      // setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error en el registro");
    }
  };

  

  return (
    <div className="register-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={handleNombreChange}
          required
        />
        {nombreError && <p className="error-text">{nombreError}</p>}

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
        {emailError && <p className="error-text">{emailError}</p>}

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={handlePasswordChange}
          required
        />

        <br />
        {password.length > 0 && password.length < 6 && (
          <p className="error-text">La contraseña debe tener al menos 6 caracteres</p>
        )}
        <div className="password-strength">
          <div
            className={`strength-bar strength-${passwordStrength}`}
            style={{ width: `${(passwordStrength / 4) * 100}%` }}
          ></div>
          <p className="strength-label">{getPasswordStrengthLabel(passwordStrength)}</p>
        </div>  
        
        <br />
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
        />
        {confirmPasswordError && <p className="error-text">{confirmPasswordError}</p>}

        {error && <p className="error-text">{error}</p>}

        <p className="login-text">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="login-link">
            Inicia sesión
          </a>
        </p>

        <button type="submit">Registrarse</button>
      </form>
      {/* Modal de registro correcto */}
      <Modal
        show={modal.show}
        onClose={() => {
          setModal({ show: false, message: "" });
          navigate("/login"); // Redirige al login al cerrar el modal
        }}
      >
      </Modal>
    </div>
  );
};

export default Register;