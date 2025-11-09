// Componente mejorado para manejar imágenes temporales sin depender de internet
import React from 'react';

export const createPlaceholderImages = () => {

  // Rutas locales de imágenes de relleno
  const placeholders = {
    'torre-fantastica.jpg': '/images/placeholders/torre-fantastica.jpg',
    'porsche.jpg': '/images/placeholders/porsche.jpg',
    'cyberpunk.jpg': '/images/placeholders/cyberpunk.jpg',
    'dragon.jpg': '/images/placeholders/dragon.jpg',
    'castillo.jpg': '/images/placeholders/castillo.jpg',
    'leon.jpg': '/images/placeholders/leon.jpg',
    'edificios.jpg': '/images/placeholders/edificios.jpg',
    'sprites.jpg': '/images/placeholders/sprites.jpg',
    'guerrero.jpg': '/images/placeholders/guerrero.jpg',
    'montana.jpg': '/images/placeholders/montana.jpg',
    'armas.jpg': '/images/placeholders/armas.jpg',
    'vehiculos.jpg': '/images/placeholders/vehiculos.jpg',
  };

  const getImageUrl = (filename) => {
    if (!filename) return '/images/default.jpg';
    if (filename.startsWith('/images/')) {
      const imgName = filename.replace('/images/', '');
      return placeholders[imgName] || '/images/default.jpg';
    }
    return filename;
  };

  return { getImageUrl };
};

export default createPlaceholderImages;
