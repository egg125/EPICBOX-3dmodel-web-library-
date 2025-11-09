import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import Modal from "./Modal";

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

const Valoracion = ({ valoracion }) => {
  const estrellas = [];
  const val = Math.round(valoracion ?? 0);
  for (let i = 1; i <= 5; i++) {
    estrellas.push(
      <span
        key={i}
        style={{
          color: i <= val ? "#ffd700" : "#ccc",
          fontSize: "16px",
          marginRight: "2px",
        }}
      >
        ★
      </span>
    );
  }
  return <span>{estrellas}</span>;
};

const ProductCard = ({ producto, onAddToCart }) => {
  const handleClick = () => {
    sessionStorage.setItem("assetActualId", producto._id);
    window.location.href = "/ver_modelo";
  };

  return (
    <div className="product-card" onClick={handleClick} style={{ cursor: "pointer" }}>
      <div className="image-container">
        <img
          src={getSafeImage(producto.imagen_descriptiva)}
          alt={producto.titulo}
        />
      </div>
      <div className="product-info">
        <h3>{producto.titulo}</h3>
        <span className="badge">{producto.tipo}</span>
        <p className="description">{producto.descripcion}</p>
        <p className="price">
          <Valoracion valoracion={producto.valoracion} />
        </p>
        <button
          className="add-cart-btn"
          onClick={e => {
            e.stopPropagation();
            onAddToCart(producto._id);
          }}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
};

const Home = () => {
  const [productos, setProductos] = useState([]);
  const [carruselIndexArriba, setCarruselIndexArriba] = useState(0);
  const [carruselIndexAbajo, setCarruselIndexAbajo] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [modal, setModal] = useState({ show: false, message: "" });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/assets");
        setProductos(Array.isArray(res.data.assets) ? res.data.assets : []);
      } catch (error) {
        setProductos([]);
      }
    };
    fetchAssets();
  }, []);

  // Responsive: cambia itemsPerView según el ancho de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) setItemsPerView(1);
      else if (window.innerWidth < 900) setItemsPerView(2);
      else if (window.innerWidth < 1200) setItemsPerView(3);
      else setItemsPerView(4);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addToCart = async (assetId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setModal({
        show: true,
        message: "Necesitas iniciar sesión para poder añadir productos al carrito.",
      });
      return;
    }
    try {
      await axios.post(
        "http://localhost:5000/api/cart/add",
        { assetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModal({
        show: true,
        message: "¡Producto añadido correctamente al carrito!",
      });
    } catch (error) {
      setModal({
        show: true,
        message: error.response?.data?.message || "Error al agregar al carrito",
      });
    }
  };

  // Divide productos en dos filas
  const filaArriba = productos.slice(0, 4);
  const filaAbajo = productos.slice(4);

  // Carrusel para filaArriba
  const maxCarruselArriba = Math.max(0, filaArriba.length - itemsPerView);
  const visiblesArriba = filaArriba.slice(carruselIndexArriba, carruselIndexArriba + itemsPerView);

  // Carrusel para filaAbajo
  const maxCarruselAbajo = Math.max(0, filaAbajo.length - itemsPerView);
  const visiblesAbajo = filaAbajo.slice(carruselIndexAbajo, carruselIndexAbajo + itemsPerView);

  return (
    <div className="home-container">
      {/* Carrusel fila arriba */}
      {filaArriba.length > 0 && (
        <div className="carrusel-fila">
          <button
            className="carrusel-arrow carrusel-arrow-left"
            onClick={() => setCarruselIndexArriba(i => Math.max(0, i - 1))}
            disabled={carruselIndexArriba === 0}
            aria-label="Anterior"
          >
            &#8592;
          </button>
          <div className="carrusel-productos">
            {visiblesArriba.map(producto => (
              <ProductCard
                key={producto._id}
                producto={producto}
                onAddToCart={addToCart}
              />
            ))}
          </div>
          <button
            className="carrusel-arrow carrusel-arrow-right"
            onClick={() => setCarruselIndexArriba(i => Math.min(maxCarruselArriba, i + 1))}
            disabled={carruselIndexArriba >= maxCarruselArriba}
            aria-label="Siguiente"
          >
            &#8594;
          </button>
        </div>
      )}
      {/* Carrusel fila abajo */}
      {filaAbajo.length > 0 && (
        <div className="carrusel-fila">
          <button
            className="carrusel-arrow carrusel-arrow-left"
            onClick={() => setCarruselIndexAbajo(i => Math.max(0, i - 1))}
            disabled={carruselIndexAbajo === 0}
            aria-label="Anterior"
          >
            &#8592;
          </button>
          <div className="carrusel-productos">
            {visiblesAbajo.map(producto => (
              <ProductCard
                key={producto._id}
                producto={producto}
                onAddToCart={addToCart}
              />
            ))}
          </div>
          <button
            className="carrusel-arrow carrusel-arrow-right"
            onClick={() => setCarruselIndexAbajo(i => Math.min(maxCarruselAbajo, i + 1))}
            disabled={carruselIndexAbajo >= maxCarruselAbajo}
            aria-label="Siguiente"
          >
            &#8594;
          </button>
        </div>
      )}
      {/* Modal para mensajes */}
      <Modal show={modal.show} onClose={() => setModal({ show: false, message: "" })}>
        <p>{modal.message}</p>
      </Modal>
    </div>
  );
};

export default Home;