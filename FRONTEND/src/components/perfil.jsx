import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { FaUser, FaTrash } from "react-icons/fa";
import axios from "axios";
import "./perfil.css";

const getSafeImage = (imagen) => {
  if (Array.isArray(imagen)) {
    if (!imagen[0]) return "/images/default.jpg";
    if (imagen[0].startsWith("data:")) return imagen[0];
    if (/^[a-zA-Z0-9_-]{10,}$/.test(imagen[0])) {
      return `http://localhost:5000/api/drive/file/${imagen[0]}`;
    }
    if (imagen[0].startsWith("http")) return imagen[0];
    return `data:image/jpeg;base64,${imagen[0]}`;
  }
  if (typeof imagen === "string") {
    if (imagen.startsWith("data:")) return imagen;
    if (/^[a-zA-Z0-9_-]{10,}$/.test(imagen)) {
      return `http://localhost:5000/api/drive/file/${imagen}`;
    }
    if (imagen.startsWith("http")) return imagen;
    return `data:image/jpeg;base64,${imagen}`;
  }
  return "/images/default.jpg";
};

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [modal, setModal] = useState({ show: false, assetId: null });
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error al obtener perfil:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate, token]);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/assets/user/${user._id}`);
        setAssets(res.data);
      } catch (err) {
        console.error("Error al obtener assets del usuario:", err);
      }
    };

    const fetchDownloadHistory = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/historial", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDownloadHistory(res.data);
      } catch (err) {
        console.error("Error al obtener historial de descargas:", err);
      }
    };

    fetchAssets();
    fetchDownloadHistory();
  }, [user, token]);

  const handleDeleteAsset = async (assetId) => {
    try {
      await axios.delete(`http://localhost:5000/api/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets((prevAssets) => prevAssets.filter((asset) => asset._id !== assetId));
      setModal({ show: false, assetId: null });
    } catch (err) {
      console.error("Error al eliminar el asset:", err);
    }
  };

  const handleAssetClick = (assetId) => {
    sessionStorage.setItem("assetActualId", assetId);
    window.location.href = "/ver_modelo";
  };

  if (!user) return <p>Cargando perfil...</p>;

  return (
    <div className="perfil-container">
      <div className="user-name-display">Hola, {user.nombre}</div>
      <div className="perfil-select-container">
        <select
          className="perfil-select"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "upload") navigate("/upload");
            else if (value === "configuracion") navigate("/configuracion");
            else if (value === "logout") {
              localStorage.removeItem("token");
              navigate("/login");
            }
            e.target.value = "";
          }}
          defaultValue=""
        >
          <option value="" disabled hidden>
            Mi Perfil <FaUser />
          </option>
          <option value="upload">Subir assets</option>
          <option value="configuracion">Configuración</option>
          <option value="logout">Cerrar sesión</option>
        </select>
      </div>

      {/* Mis Assets */}
      <div className="assets-wrapper">
        <h2 className="assets-title">Assets subidos</h2>
        {assets.length === 0 ? (
          <p style={{ color: "yellow" }}>No tienes assets subidos.</p>
        ) : (
          <div className="assets-grid">
            {assets.map((asset) => (
              <div key={asset._id} className="asset-card">
                <div
                  className="asset-image-container"
                  onClick={() => handleAssetClick(asset._id)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={getSafeImage(asset.imagen_descriptiva)}
                    alt={asset.titulo}
                  />
                </div>
                <h3 className="asset-title">{asset.titulo}</h3>
                <button
                  className="delete-button"
                  onClick={() => setModal({ show: true, assetId: asset._id })}
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Descargas */}
      <div className="download-history-wrapper">
        <h2>Historial de Descargas</h2>
        <div className="history-assets">
          {downloadHistory.flatMap((record) =>
            record.assets.map((asset) => (
              <div
                key={`${record._id}-${asset._id}`}
                className="history-asset"
                onClick={() => handleAssetClick(asset._id)}
                style={{ cursor: "pointer" }}
                title={asset.titulo}
              >
                <img
                  src={getSafeImage(asset.imagen_descriptiva)}
                  alt={asset.titulo}
                />
                <h3 className="asset-title">{asset.titulo}</h3>
                {asset.valoracion !== undefined && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        style={{
                          color: i <= Math.round(asset.valoracion) ? "#FFD700" : "#888",
                          fontSize: "16px",
                          margin: "0 1px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para eliminar asset */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>¿Estás seguro de que deseas eliminar este asset?</p>
            <div className="modal-actions">
              <button
                className="confirm-button"
                onClick={() => handleDeleteAsset(modal.assetId)}
              >
                Confirmar
              </button>
              <button
                className="cancel-button"
                onClick={() => setModal({ show: false, assetId: null })}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
