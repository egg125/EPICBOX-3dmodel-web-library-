import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaFilter, FaSort, FaThLarge, FaList, FaAngleDown, FaAngleUp, FaStar, FaTimes } from "react-icons/fa";
import axios from 'axios';
import "./Search.css";

// Utilidad para obtener la imagen segura (igual que en Home)
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

const TIPOS = ["3D", "2D", "Script", "Pack", "Efecto"];

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("q") || "";

  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortOption, setSortOption] = useState("rating-high");
  const [showFilters, setShowFilters] = useState(false);
  const [tipoFilters, setTipoFilters] = useState({
    "3D": false,
    "2D": false,
    "Script": false,
    "Pack": false,
    "Efecto": false
  });
  const [loading, setLoading] = useState(true);

  // Carrusel
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Etiquetas
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");

  // Fetch search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/assets');
        let results = res.data.assets || res.data; // Soporta ambos formatos

        // Extraer todas las etiquetas disponibles
        const allTags = new Set();
        results.forEach(asset => {
          if (asset.etiquetas && Array.isArray(asset.etiquetas)) {
            asset.etiquetas.forEach(tag => allTags.add(tag));
          }
        });
        setAvailableTags(Array.from(allTags).sort());

        setSearchResults(results);
        setFilteredResults(results);
      } catch (error) {
        setSearchResults([]);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  // Aplica filtros y ordena
  useEffect(() => {
    applyFilters(searchResults, tipoFilters, selectedTags, sortOption, searchQuery);
    setCarouselIndex(0); // Reinicia el carrusel al cambiar filtros
    // eslint-disable-next-line
  }, [tipoFilters, selectedTags, sortOption, searchResults, searchQuery]);

  // Cambia el filtro de tipo
  const handleTipoChange = (tipo) => {
    const newFilters = {
      ...tipoFilters,
      [tipo]: !tipoFilters[tipo]
    };
    setTipoFilters(newFilters);
  };

  // Aplica todos los filtros y búsqueda
  const applyFilters = (results, tipos, tags, sort, searchQuery) => {
    let filtered = [...results];

    // Filtrar por búsqueda de texto (en título, descripción o etiquetas)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.titulo?.toLowerCase().includes(q) ||
        asset.descripcion?.toLowerCase().includes(q) ||
        (asset.etiquetas && asset.etiquetas.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Filtrar por tipos (inclusivo, OR)
    const activeTipos = Object.keys(tipos).filter(t => tipos[t]);
    if (activeTipos.length > 0) {
      filtered = filtered.filter(asset => {
        const assetTipo = (asset.tipo || "").toLowerCase().replace(/\s/g, "");
        return activeTipos.some(tipo => assetTipo === tipo.toLowerCase().replace(/\s/g, ""));
      });
    }

    // Filtrar por etiquetas
    if (tags.length > 0) {
      filtered = filtered.filter(asset => {
        if (!asset.etiquetas || !Array.isArray(asset.etiquetas)) return false;
        return tags.some(tag => asset.etiquetas.includes(tag));
      });
    }

    // Ordenar resultados
    switch (sort) {
      case "rating-high":
        filtered.sort((a, b) => (b.valoracion || 0) - (a.valoracion || 0));
        break;
      case "rating-low":
        filtered.sort((a, b) => (a.valoracion || 0) - (b.valoracion || 0));
        break;
      default:
        filtered.sort((a, b) => (b.valoracion || 0) - (a.valoracion || 0));
        break;
    }

    setFilteredResults(filtered);
  };

  // Handle tag selection
  const handleTagSelect = (e) => {
    const tag = e.target.value;
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
    }
    setCurrentTag("");
  };

  // Remove a selected tag
  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
  };

  // Handle product click
  const handleProductClick = (assetId) => {
    sessionStorage.setItem('assetActualId', assetId);
    navigate('/ver_modelo');
  };

  // Carrusel helpers
  const showCarousel = filteredResults.length > 1;
  const currentAsset = filteredResults[carouselIndex] || null;

  const handlePrev = () => setCarouselIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCarouselIndex(i => Math.min(filteredResults.length - 1, i + 1));

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Resultados para: "{searchQuery}"</h1>
        <div className="search-stats">
          {filteredResults.length} {filteredResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </div>
      </div>

      <div className="search-container">
        {/* Panel de filtros */}
        <div className={`filters-panel ${showFilters ? 'show' : ''}`}>
          <div className="filters-header">
            <h2>Filtros</h2>
            <button
              className="mobile-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <FaAngleUp /> : <FaAngleDown />}
            </button>
          </div>

          <div className="filter-section">
            <h3>Tipos</h3>
            {Object.keys(tipoFilters).map(tipo => (
              <div className="filter-option" key={tipo}>
                <input
                  type="checkbox"
                  id={`tipo-${tipo}`}
                  checked={tipoFilters[tipo]}
                  onChange={() => handleTipoChange(tipo)}
                />
                <label
                  htmlFor={`tipo-${tipo}`}
                  onClick={() => handleTipoChange(tipo)}
                >{tipo}</label>
              </div>
            ))}
          </div>

          <div className="filter-section">
            <h3>Etiquetas</h3>
            <div className="tags-dropdown">
              <select
                value={currentTag}
                onChange={handleTagSelect}
              >
                <option value="">Seleccionar etiqueta</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <div className="selected-tags">
                {selectedTags.map(tag => (
                  <div key={tag} className="selected-tag">
                    {tag}
                    <button
                      className="remove-tag"
                      onClick={() => removeTag(tag)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor principal de resultados */}
        <div className="results-container">
          {/* Barra de controles */}
          <div className="results-controls">
            <div className="mobile-filters-button">
              <button onClick={() => setShowFilters(!showFilters)}>
                <FaFilter /> Filtros
              </button>
            </div>

            <div className="sort-controls">
              <div className="sort-dropdown">
                <FaSort />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="rating-high">Valoración: mayor a menor</option>
                  <option value="rating-low">Valoración: menor a mayor</option>
                </select>
              </div>
            </div>

            <div className="view-controls">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                <FaThLarge />
              </button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                <FaList />
              </button>
            </div>
          </div>

          {/* Resultados con carrusel */}
          {loading ? (
            <div className="no-results">
              <h2>Cargando resultados...</h2>
            </div>
          ) : filteredResults.length > 0 ? (
            showCarousel ? (
              <div className="search-carousel">
                <button
                  className="carrusel-arrow carrusel-arrow-left"
                  onClick={handlePrev}
                  disabled={carouselIndex === 0}
                  aria-label="Anterior"
                >
                  &#8592;
                </button>
                <div
                  className="product-card"
                  onClick={() => handleProductClick(currentAsset._id)}
                >
                  <div className="image-container">
                    <img
                      src={getSafeImage(currentAsset.imagen_descriptiva)}
                      alt={currentAsset.titulo}
                    />
                  </div>
                  <div className="product-info">
                    <h3>{currentAsset.titulo}</h3>
                    <div className="product-creator">por {currentAsset.creador || "Usuario"}</div>
                    <div className="product-meta">
                      <div className="product-category">{currentAsset.tipo || "Otro"}</div>
                      <div className="product-rating">
                        <FaStar />
                        {(currentAsset.valoracion || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="product-tags">
                      {(currentAsset.etiquetas || []).map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  className="carrusel-arrow carrusel-arrow-right"
                  onClick={handleNext}
                  disabled={carouselIndex >= filteredResults.length - 1}
                  aria-label="Siguiente"
                >
                  &#8594;
                </button>
              </div>
            ) : (
              <div className={`search-results ${viewMode}`}>
                {filteredResults.map(asset => (
                  <div
                    key={asset._id}
                    className="product-card"
                    onClick={() => handleProductClick(asset._id)}
                  >
                    <div className="image-container">
                      <img
                        src={getSafeImage(asset.imagen_descriptiva)}
                        alt={asset.titulo}
                      />
                    </div>
                    <div className="product-info">
                      <h3>{asset.titulo}</h3>
                      <div className="product-creator">por {asset.creador || "Usuario"}</div>
                      <div className="product-meta">
                        <div className="product-category">{asset.tipo || "Otro"}</div>
                        <div className="product-rating">
                          <FaStar />
                          {(asset.valoracion || 0).toFixed(1)}
                        </div>
                      </div>
                      <div className="product-tags">
                        {(asset.etiquetas || []).map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="no-results">
              <h2>No se encontraron resultados para "{searchQuery}"</h2>
              <p>Intenta con otras palabras clave o navega por tipos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;