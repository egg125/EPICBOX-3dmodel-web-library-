import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UploadAsset.css";
import Modal from "./Modal";

const UploadAsset = () => {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [imagenDescriptiva, setImagenDescriptiva] = useState(null);
  const [etiquetas, setEtiquetas] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modal, setModal] = useState({ show: false, message: "" }); // Estado para el modal
  // Refs para los inputs de tipo file
  const archivoRef = useRef();
  const imagenRef = useRef();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("tipo", tipo);
    formData.append("descripcion", descripcion);
    formData.append("usuario_id", localStorage.getItem("userId")); // Asegúrate de guardar esto al iniciar sesión

    if (archivo) formData.append("archivo", archivo);
    if (imagenDescriptiva) formData.append("imagen_descriptiva", imagenDescriptiva);
    formData.append("etiquetas", etiquetas); // Como string separado por comas (el backend lo puede dividir)

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/assets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      setModal({
        show: true,
        message: "Subiendo Asset...",
      });
      setSuccess("Asset subido con éxito");
      setTitulo("");
      setTipo("");
      setDescripcion("");
      setArchivo(null);
      setImagenDescriptiva(null);
      setEtiquetas("");
      // Espera 1.5 segundos antes de ocultar la barra de progreso
      setTimeout(() => setUploadProgress(0), 1500);

      // Redirige a la página del asset usando el ID devuelto
      if (response.data && response.data._id) {
        navigate(`/asset/${response.data._id}`);
      }

      if (archivoRef.current) archivoRef.current.value = "";
      if (imagenRef.current) imagenRef.current.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Error al subir el asset");
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-asset-container">
      <h2>
        Subir Asset <span role="img" aria-label="upload" style={{ marginRight: "8px" }}>⭳</span>
      </h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título</label>
        <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <label htmlFor="tipo">Tipo</label>
        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
          <option value="">Selecciona un tipo</option>
          <option value="3D">3D</option>
          <option value="2D">2D</option>
          <option value="Script">Script</option>
          <option value="Pack">Pack</option>
          <option value="Efecto">Efecto</option>
        </select>

        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />

        <label htmlFor="archivo">Archivo</label>
        <input
          type="file"
          id="archivo"
          ref={archivoRef}
          onChange={(e) => setArchivo(e.target.files[0])}
          required
        />

        <label htmlFor="imagen_descriptiva">Imagen Descriptiva</label>
        <input
          type="file"
          id="imagen_descriptiva"
          ref={imagenRef}
          onChange={(e) => setImagenDescriptiva(e.target.files[0])}
          required
        />

        <label htmlFor="etiquetas">Etiquetas (separadas por comas)</label>
        <input type="text" id="etiquetas" value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} required />

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}
        {uploadProgress > 0 && (
          
          <div className="progress-bar">
            <span></span>
          </div>
        )}

        <button type="submit">Subir Asset</button>
      </form>
      {modal.show && (
        <Modal show={modal.show} onClose={() => setModal({ show: false, message: "" })}>
          <p>{modal.message}</p>
        </Modal>
      )}
    </div>
  );
};

export default UploadAsset;
