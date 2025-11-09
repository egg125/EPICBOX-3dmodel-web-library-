import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Home from "./components/Home";
import Login from "./components/login";
import Register from "./components/register";
import Ver_Modelo from "./components/ver_modelo";
import UploadAsset from "./components/UploadAsset";
import Search from "./components/Search"; // Importamos el componente Search
import Configuracion from './components/configuracion';
import Perfil from "./components/perfil"; 
import Cart from "./components/cart";  //carrito


import "./App.css";

function App() {
  return (
    <Router>
      <Header />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ver_modelo" element={<Ver_Modelo />} />
          <Route path="/search" element={<Search />} /> {/* Añadimos la ruta para Search */}
          <Route path="/upload" element={<UploadAsset />} />
          <Route path="*" element={<h2 className="not-found-page">Página no encontrada</h2>} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/cart" element={<Cart />} /> {/* Añadimos la ruta para Cart */}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;