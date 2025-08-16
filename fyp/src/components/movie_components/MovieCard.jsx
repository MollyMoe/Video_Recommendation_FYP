

import React, { useState, useEffect } from 'react';
import offlineFallback from "../../images/offlineFallback.jpg";

function MovieCard({ movie, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
    useEffect(() => {
      const handleOnlineStatus = () => setIsOnline(navigator.onLine);
  
      window.addEventListener("online", handleOnlineStatus);
      window.addEventListener("offline", handleOnlineStatus);
  
      return () => {
        window.removeEventListener("online", handleOnlineStatus);
        window.removeEventListener("offline", handleOnlineStatus);
      };
    }, []);

// useEffect(() => {
//   let isMounted = true;

//   const fetchLocalPoster = async () => {
//     if (!isOnline && window.electron?.getPoster) {
//       const posterPath = await window.electron.getPoster(movie.movieId); // custom preload function
//       if (isMounted) setLocalPoster(posterPath || null);
//     }
//   };

//   fetchLocalPoster();
//   return () => {
//     isMounted = false;
//   };
// }, [isOnline, movie.movieId]);

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

        src={movie.poster_url}
        alt={movie.title || "No title"}
        loading="lazy"
        onError={(e) => {
          if (e.currentTarget.src !== offlineFallback) {
            e.currentTarget.src = offlineFallback;
          }
        }}
        className="w-full h-full object-cover rounded-lg"
      />

      </div>

      {/* Trailer Preview */}
      {isHovered && movie.trailer_key && (
        <div className={`absolute top-9 w-[350px] z-50 pointer-events-none ${trailerAlign}`}>
          <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
            {isOnline && movie.trailer_key ? (
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full object-cover"
                title={movie.title}
                />
              ) : (
              <img
                src={movie.poster_url}
                alt={movie.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = offlineFallback;
                }}
                className="w-full h-full object-cover rounded-lg"
                  />
            )}
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
