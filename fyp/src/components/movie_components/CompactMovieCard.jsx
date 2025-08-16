
// components/movie_components/CompactMovieCard.jsx
import React from "react";
import { Play, Trash2 } from "lucide-react";

const CompactMovieCard = ({
  movie,
  isSubscribed,
  isOnline,
  onPlay,
  onRemove,
}) => {
  const disabled = !isSubscribed || !isOnline;

  return (
    <div
      key={movie._id || movie.movieId}
      className="bg-white rounded-lg shadow p-2 flex flex-col justify-between h-[320px]"
    >
      <img
        src={movie.poster_url || "https://via.placeholder.com/150"}
        alt={movie.title || "No Title"}
        className="rounded mb-2 w-full h-60 object-cover"
      />
      <h3 className="text-sm font-semibold mb-2 line-clamp-2">{movie.title}</h3>

      <div className="flex justify-center gap-2 mt-auto">
        {/* ✅ Play Button (requires both subscribed & online) */}
        <button
          onClick={() => onPlay(movie.movieId, movie.trailer_url)}
          disabled={!isSubscribed || !isOnline}
          className={`flex items-center justify-center flex-1 text-xs px-2 py-1 rounded-lg shadow-sm
    ${
      !isSubscribed || !isOnline
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-white text-black hover:bg-gray-200"
    }`}
        >
          <Play className="w-3 h-3 mr-1 fill-black" />
          Play
        </button>

        {/* ✅ Remove Button (requires subscribed only — works offline!) */}
        <button
          onClick={() => onRemove(movie.movieId)}
          disabled={!isSubscribed} // 🔥 Only check subscription, not online
          className={`flex items-center justify-center flex-1 text-xs px-2 py-1 rounded-lg shadow-sm
    ${
      !isSubscribed
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-white text-black hover:bg-gray-200"
    }`}
        >
          <Trash2 className="w-3 h-3 mr-1 fill-black" />
          Remove
        </button>
      </div>
    </div>
  );
};


export default CompactMovieCard;

