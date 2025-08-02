import React, { useState } from 'react';

function MovieCard({ movie, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine trailer alignment class
const trailerAlign = 'left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative cursor-pointer w-[180px] overflow-visible"
      onClick={() => onClick(movie)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Movie Poster */}
      <div
        className={`aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src={movie.poster_url || 'https://via.placeholder.com/150'}
          alt={movie.title || 'No title'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Trailer Preview */}
      {isHovered && movie.trailer_key && (
        <div className={`absolute top-9 w-[350px] z-50 pointer-events-none ${trailerAlign}`}>
          <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}&controls=0`}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full object-cover"
              title={movie.title}
            ></iframe>
          </div>
          <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl space-y-1">
            <div>{Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}</div>
            <div className="font-semibold text-sm">
              ⭐ {movie.predicted_rating?.toFixed(1) || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieCard;