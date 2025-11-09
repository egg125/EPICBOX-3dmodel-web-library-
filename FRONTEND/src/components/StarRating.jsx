// StarRating.js
import React from 'react';

const StarRating = ({ rating, onRatingChange }) => {
  const handleStarClick = (value) => {
    if (onRatingChange) {
      onRatingChange(value); // Actualiza el valor de la valoración
    }
  };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{ cursor: 'pointer', fontSize: '20px' }}
        onClick={() => handleStarClick(i)}
      >
        {i <= rating ? '⭐' : '☆'}
      </span>
    );
  }

  return <div>{stars}</div>;
};

export default StarRating;
