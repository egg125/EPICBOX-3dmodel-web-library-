import { useState } from "react";
import axios from "axios";
import "./login.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar el error antes de hacer la solicitud
    try {
      // Hacer una solicitud POST al backend para loguearse
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // Extraemos el token y los datos del usuario de la respuesta
      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error("No se recibieron datos válidos del usuario");
      }

      // Guardar el token y los datos completos del usuario en localStorage
      localStorage.setItem("token", token); // Guardamos el token
      localStorage.setItem("user", JSON.stringify(user)); // Guardamos todos los datos del usuario como un objeto JSON

      // Consola para ver el token y los datos del usuario
      console.log("Token recibido:", token);
      console.log("Datos del usuario:", user);

      // Redirigir al usuario al dashboard
      navigate("/perfil");
    } catch (err) {
      // Capturar errores de la solicitud, como credenciales inválidas
      setError(err.response?.data?.message || "Credenciales inválidas");
      console.error("Error en el login:", err); // Imprimir error en consola para depuración
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <p className="register-text">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="register-link">
            Regístrate
          </a>
        </p>

        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
};

export default Login;
