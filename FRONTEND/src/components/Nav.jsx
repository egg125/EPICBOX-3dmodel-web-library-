import React from "react";
import "./Nav.css";

const Nav = () => {
  return (
    <nav className="header-nav">
      <ul className="nav-list">
        <li className="nav-item">3D</li>
        <li className="nav-item">2D</li>
        <li className="nav-item">Scripts</li>
        <li className="nav-item">Packs</li>
        <li className="nav-item">Efectos</li>
      </ul>
    </nav>
  );
};

export default Nav;