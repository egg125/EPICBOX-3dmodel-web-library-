import { useState, useEffect } from "react";
import axios from "axios";
import "./configuracion.css";
import { useNavigate } from "react-router-dom";

const Configuracion = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos actuales del usuario
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNombre(res.data.nombre);
      setEmail(res.data.email);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/auth/profile",
        { nombre, email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/perfil");
    } catch (err) {
      setError("Error al actualizar datos");
    }
  };

  return (
    <div className="config-container">
    <h2 className="config-title">
        Configuración <span className="material-symbols-outlined">settings</span>
    </h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Cambiar nombre de usuario</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        <label htmlFor="email">Cambiar correo electrónico</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="password">Nueva Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
};

export default Configuracion;
