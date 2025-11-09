import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './cart.css';

const getSafeImage = (imagen) => {
  if (Array.isArray(imagen)) {
    if (!imagen[0]) return "/images/default.jpg";
    // Si es base64
    if (imagen[0].startsWith("data:")) return imagen[0];
    // Si parece un fileId de Drive (ajusta si hace falta)
    if (/^[a-zA-Z0-9_-]{10,}$/.test(imagen[0])) {
      return `http://localhost:5000/api/drive/file/${imagen[0]}`;
    }
    // Si es URL completa
    if (imagen[0].startsWith("http")) return imagen[0];
    // Si es base64 sin prefijo
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


const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  // Fetch del carrito
  const fetchCartItems = async () => {
    const token = localStorage.getItem("token");
    if (!token) return console.warn("No estás autenticado.");

    try {
      const res = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(res.data.assets);
    } catch (err) {
      console.error('Error al obtener items del carrito:', err);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Navegar al modelo
  const handleAssetClick = (assetId) => {
    sessionStorage.setItem("assetActualId", assetId);
    window.location.href = "/ver_modelo";
  };

  // Eliminar del carrito
  const handleRemoveFromCart = async (e, assetId) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return alert("Debes iniciar sesión.");

    try {
      await axios.delete(`http://localhost:5000/api/cart/remove/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(prev => prev.filter(item => item._id !== assetId));
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("No se pudo eliminar.");
    }
  };

  // Descargar ZIP del backend
  const handleDownloadAssets = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Debes iniciar sesión para descargar.");

    try {
      const response = await axios.get('http://localhost:5000/api/cart/download', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/zip' });

      let fileName = 'assets.zip';
      const disposition = response.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?(.+?)"?$/);
        if (match?.[1]) fileName = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar:', err);
      alert("No se pudo descargar el ZIP.");
    }
  };

  return (
    <div className="cart-container">
    <h2 className="cart-title">Mi cesta</h2>

    {cartItems.length === 0 ? (
      <p>Tu carrito está vacío</p>
    ) : (
      <div className="cart-content">
        {/* Columna izquierda: lista de assets */}
        <div className="cart-list">
          {cartItems.map((asset, i) => (
            <div
              className="cart-item"
              key={i}
              onClick={() => handleAssetClick(asset._id)}
            >
              <div className="cart-image-container">
                <img
                  src={getSafeImage(asset.imagen_descriptiva)}
                  alt={asset.titulo}
                  className="cart-image"
                />
              </div>
              <div className="cart-info">
                <h3>{asset.titulo}</h3>
                <p>{asset.descripcion}</p>
              </div>
              <button
                className="remove-btn"
                onClick={(e) => handleRemoveFromCart(e, asset._id)}
              >
                x
              </button>
            </div>
          ))}
        </div>

        {/* Columna derecha: resumen */}
       <div className="download-summary">
        <h3 className="summary-title">Resumen de la descarga</h3>
        <p className="summary-count">
          <strong>Número de assets:</strong> {cartItems.length}
        </p>
        <button className="download-btn" onClick={handleDownloadAssets}>
          Comprimir y Descargar
        </button>
      </div>

      </div>
    )}
  </div>

  );
};

export default Cart;
