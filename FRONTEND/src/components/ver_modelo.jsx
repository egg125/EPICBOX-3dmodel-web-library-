import { useState, useEffect } from "react";
import axios from "axios";
import "./login.css";
import "./ver_modelo.css";
import { FaShoppingCart, FaDownload, FaTag, FaExpand, FaTimes, FaStar } from "react-icons/fa";
import Modal from "./Modal";

// Hook para alternar visibilidad de comentarios
const useCommentsToggle = () => {
  const [showComments, setShowComments] = useState(true);
  const toggleComments = () => setShowComments((prev) => !prev);
  return { showComments, toggleComments };
};

let averagePuntuacion = 1;
const Ver_Modelo = () => {
  const assetId = sessionStorage.getItem("assetActualId");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState(null);
  const { showComments, toggleComments } = useCommentsToggle();
  const [assetData, setAssetData] = useState(null); // Estado para los datos del asset
  const [scriptContent, setScriptContent] = useState(""); // Estado para el contenido del script
  const [modal, setModal] = useState({ show: false, message: "" }); // Estado para el modal
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const userToken = localStorage.getItem("token");

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
  const fetchScriptContent = async (fileUrl) => {
  try {
    const res = await axios.get(fileUrl, { responseType: "text" });
    return res.data;
  } catch (error) {
    console.error("Error al cargar el contenido del script:", error);
    return "Error al cargar el contenido del script.";
  }
};
  const updateAssetRating = async (newRating) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/assets/${assetId}/rating`,
        { valoracion: newRating },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      console.log("Valoración actualizada:", res.data);
  
      // Actualizar el estado local con la nueva valoración
      setAssetData((prevAssetData) => ({
        ...prevAssetData,
        valoracion: newRating,
      }));
    } catch (error) {
      console.error("Error al actualizar la valoración:", error);
    }
  };
  // Cargar datos del asset y comentarios
  useEffect(() => {
    if (!assetId) {
      console.error("No se ha encontrado el ID del asset en sessionStorage.");
      setError("No se ha encontrado el ID del asset.");
      return;
    }
  
    const fetchAsset = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/assets/${assetId}`);
        setAssetData(res.data);
        
        // Si es un script, cargar el contenido del archivo
        if (res.data.tipo === "script" && res.data.archivo?.[0]) {
          try {
            const content = await fetchScriptContent(`${API_URL}/api/drive/file/${res.data.archivo[0]}`);
            console.log("Contenido del script:", content);
            setScriptContent(content);
          } catch (error) {
            console.error("Error al cargar el script:", error);
            setScriptContent("No se pudo cargar el contenido del script.");
          }
        }
        
        setError(null);
      } catch (err) {
        console.error("Error al cargar el asset:", err);
        setError("No se pudo cargar el modelo. Verifica que el ID sea válido.");
      }
    };
  
    const fetchComments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/comments/asset/${assetId}`);
        setComments(res.data);
  
        // Calcular la media de las puntuaciones
        const totalPuntuaciones = res.data.reduce((sum, comment) => sum + (comment.puntuacion || 0), 0);
        const averagePuntuacion = res.data.length > 0 ? totalPuntuaciones / res.data.length : 0;
  
        console.log("Media de puntuaciones calculada:", averagePuntuacion);
  
        // Actualizar la valoración del asset en el backend
        await updateAssetRating(averagePuntuacion);
  
        // Guardar la valoración en sessionStorage
        sessionStorage.setItem("assetValoracion", averagePuntuacion.toFixed(1));
      } catch (err) {
        console.error("Error al cargar los comentarios:", err);
      }
    };
  
    fetchAsset();
    fetchComments();
  }, [API_URL, assetId]);

  // Navegar entre imágenes
  const handleNextImage = () => {
    if (!assetData?.imagen_descriptiva?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % assetData.imagen_descriptiva.length);
  };

  const handlePreviousImage = () => {
    if (!assetData?.imagen_descriptiva?.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? assetData.imagen_descriptiva.length - 1 : prev - 1
    );
  };


    // Enviar comentario
    const handleAddComment = async () => {
      if (newComment.trim() !== "") {
        try {
          const res = await axios.post(
            `${API_URL}/api/comments`,
            {
              assetId,
              comentario: newComment.trim(),
              puntuacion: rating,
            },
            {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            }
          );
          setComments((prevComments) => [...prevComments, res.data.comment]);
          setNewComment("");
          setRating(5);

          // Actualizar la valoración del asset
          const totalPuntuaciones = [...comments, res.data.comment].reduce(
            (sum, comment) => sum + (comment.puntuacion || 0),
            0
          );
          const nuevaValoracion = totalPuntuaciones / (comments.length + 1);
          updateAssetRating(nuevaValoracion);
        } catch (err) {
          console.error("Error al enviar el comentario:", err);
        }
      }
    };
  // Añadir al carrito
  const handleAddToCart = async () => {
    if (!userToken) {
      setModal({
        show: true,
        message: "Necesitas iniciar sesión para poder añadir productos al carrito.",
      });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/cart/add`,
        { assetId },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setModal({
        show: true,
        message: "¡Producto añadido correctamente al carrito!",
      });
    } catch (err) {
      setModal({
        show: true,
        message: err.response?.data?.message || "Error al agregar al carrito",
      });
    }
  };

  // Renderizar estrellas de calificación
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`star ${i <= (hoverRating || rating) ? "filled" : ""}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        />
      );
    }
    return stars;
  };

  return (
    <>
      <div className="row" tabIndex={0} onKeyDown={(e) => {
        if (e.key === "ArrowRight") handleNextImage();
        if (e.key === "ArrowLeft") handlePreviousImage();
      }}>
        {error ? (
          <div className="error-message">{error}</div>
        ) : assetData ? (
          <>
            <div className="ver-modelo-container">
              <div className="ver-modelo-preview">
                <div className="image-container">
                  {assetData.imagen_descriptiva?.length > 0 && (
                    <img
                      src={getSafeImage(assetData.imagen_descriptiva[currentImageIndex])}
                      alt={`Vista previa del modelo ${currentImageIndex + 1}`}
                      className="ver-modelo-image"
                    />
                  )}
                  <button
                    className="expand-button"
                    onClick={() => setIsImageExpanded(true)}
                    aria-label="Ampliar imagen"
                  >
                    <FaExpand />
                  </button>
                </div>

                <div className="image-controls-numbers">
                  {assetData.imagen_descriptiva?.map((_, index) => (
                    <button
                      key={index}
                      className={`image-button ${currentImageIndex === index ? "active" : ""}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Imagen ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="ver-modelo-description">
                  Puedes interactuar con este modelo en la siguiente pantalla.
                </p>
              </div>
            </div>

            <div className="column">
              <div className="description-container">
                <h2>{assetData.titulo || "Nombre del modelo"}</h2>
                <div className="rating-display">
                  <div className="stars-display">
                    <div className="stars-background">★★★★★</div>
                    <div
                      className="stars-foreground"
                      style={{ width: `${(assetData.valoracion / 5) * 100}%` }}
                    >
                      ★★★★★
                    </div>
                  </div>
                  <span className="rating-value-display">
                    {assetData.valoracion ? assetData.valoracion.toFixed(1) : '0.0'}
                  </span>
                </div>
                <p>{assetData.descripcion || "Sin descripción disponible."}</p>
                {assetData.tipo === "script" && (
                  <div className="script-content">
                    <h3>Contenido del Script:</h3>
                    <pre>{scriptContent}</pre>
                  </div>
                )}
                <button onClick={handleAddToCart}>
                  Añadir al carrito <FaShoppingCart />
                </button>
                <div className="row">
                  <p>
                    {assetData.tipo || "3D"} <FaTag />
                  </p>
                </div>
              </div>

              <div className="opinion-container">
                <h2>Comentario:</h2>

                {userToken ? (
                  <>
                    <textarea
                      id="opinion_usu"
                      placeholder="Mi opinión de este asset es..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <div className="rating-container">{renderStars()}</div>
                    <button onClick={handleAddComment}>Enviar</button>
                    <button onClick={toggleComments} className="sin_borde">
                      {showComments ? "Ocultar Comentarios" : "Mostrar Comentarios"}
                    </button>
                  </>
                ) : (
                  <p>
                    Necesitas <a href="/login">iniciar sesión</a> para poder comentar.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="loading-message">Cargando modelo...</p>
        )}
      </div>

      {showComments && (
        <div id="comments" className="big-comment-container">
          {comments.length === 0 ? (
            <p>No hay comentarios todavía.</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="comment-container">
                <div className="comment-header">
                  <label>{comment.user?.nombre || "Anónimo"}</label>
                </div>
                <p>{comment.comentario}</p>
                <p>{"⭐ ".repeat(comment.puntuacion).trim()}</p>
                {comment.createdAt && (
                  <small>
                    {new Date(comment.createdAt).toLocaleString("es-ES")}
                  </small>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isImageExpanded && (
        <div className="expanded-image-overlay">
          <button
            className="close-button"
            onClick={() => setIsImageExpanded(false)}
            aria-label="Cerrar imagen ampliada"
          >
            <FaTimes />
          </button>
          <img
            src={getSafeImage(assetData.imagen_descriptiva[currentImageIndex])}
            alt="Imagen ampliada"
            className="expanded-image"
          />
        </div>
      )}

      <Modal show={modal.show} onClose={() => setModal({ show: false, message: "" })}>
        <p>{modal.message}</p>
      </Modal>
    </>
  );
};

export default Ver_Modelo;