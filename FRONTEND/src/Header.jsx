import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCube, FaShapes, FaCode, FaBox, FaMagic, FaSearch, FaShoppingCart, FaUser } from "react-icons/fa";
import "./Header.css";
import logo from "./logo.svg";

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleUserClick = () => {
    navigate(isAuthenticated ? "/perfil" : "/login");
  };

  // Navega a la búsqueda con filtro de categoría
  const navigateToCategory = (category) => {
    navigate(`/search?q=${encodeURIComponent(category)}`);
  };

  // Maneja la búsqueda (tanto en escritorio como móvil)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const searchValue = e.target.searchInput.value;
    navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    setShowMobileSearch(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo-container">
          <img src={logo} alt="EPICBOX" className="header-logo" onClick={() => navigate("/")} />
        </div>

        {/* Categorías */}
        <div className="header-categories">
          <div className="category-button">
            <button onClick={() => navigateToCategory("3D")}>
              <FaCube />
            </button>
            <span>3D</span>
          </div>
          <div className="category-button">
            <button onClick={() => navigateToCategory("2D")}>
              <FaShapes />
            </button>
            <span>2D</span>
          </div>
          <div className="category-button">
            <button onClick={() => navigateToCategory("Scripts")}>
              <FaCode />
            </button>
            <span>Scripts</span>
          </div>
          <div className="category-button">
            <button onClick={() => navigateToCategory("Packs")}>
              <FaBox />
            </button>
            <span>Packs</span>
          </div>
          <div className="category-button">
            <button onClick={() => navigateToCategory("Efectos")}>
              <FaMagic />
            </button>
            <span>Efectos</span>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="header-search">
          {/* Escritorio: barra de búsqueda */}
          <form className="desktop-search" onSubmit={handleSearchSubmit}>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                name="searchInput"
                placeholder="Búsqueda" 
                className="search-input" 
                autoComplete="off"
              />
            </div>
          </form>
          {/* Móvil: solo icono lupa */}
          <button
            className="mobile-search-btn"
            onClick={() => setShowMobileSearch(true)}
            aria-label="Buscar"
          >
            <FaSearch />
          </button>
        </div>

        {/* Iconos de usuario */}
        <div className="header-user-icons">
          <button className="icon-button" onClick={() => navigate("/cart")}>
            <FaShoppingCart />
          </button>
          <button className="icon-button" onClick={handleUserClick}>
            <FaUser />
          </button>
        </div>
      </div>

      {/* Modal de búsqueda móvil */}
      {showMobileSearch && (
        <div className="mobile-search-modal">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              name="searchInput"
              placeholder="Buscar..."
              className="search-input"
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              className="close-search"
              onClick={() => setShowMobileSearch(false)}
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;