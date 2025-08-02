import React from 'react';
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Trash2 } from "lucide-react";

function MovieModal({ 
  movie, 
  isOpen, 
  onClose, 
  isSubscribed,
  onPlay,
  onLike,
  onSave,
  onDelete,
  isSearching,
  children
}) {
  if (!isOpen || !movie) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
          <div className="flex space-x-6">
            <img src={movie.poster_url} alt={movie.title} className="rounded-lg w-40 h-auto object-cover" />
            <div className="flex flex-col justify-center space-y-3 flex-grow">
              <h2 className="text-2xl font-semibold">{movie.title}</h2>
              <p className="text-sm text-gray-700">
                <strong>Genres:</strong> {Array.isArray(movie.genres) ? movie.genres.join(", ") : movie.genres || "N/A"}
              </p>
              <p className="text-sm text-gray-700"><strong>Director:</strong> {movie.director || "N/A"}</p>
              <p className="text-sm text-gray-700"><strong>Actors:</strong> {Array.isArray(movie.actors) ? movie.actors.join(", ") : movie.actors || "N/A"}</p>
              <p className="text-sm text-gray-700"><strong>Overview:</strong> {movie.overview || "N/A"}</p>
              <p className="font-semibold text-sm">⭐{movie.predicted_rating !== undefined ? Number(movie.predicted_rating).toFixed(1) : "N/A"}</p>
            </div>
          </div>
          <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
            {/* Action Buttons */}
            <button onClick={() => onPlay(movie)} disabled={!isSubscribed}
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"> 
                <Play className="w-3 h-3 mr-1 fill-black" />
                Play
            </button>
            <button onClick={() => onLike(movie.movieId)} disabled={!isSubscribed}
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"> 
                <Heart className="w-4 h-4 mr-1 fill-black" /> 
                Like
            </button>
            <button onClick={() => onSave(movie.movieId)} disabled={!isSubscribed} 
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Bookmark className="w-4 h-4 mr-1 fill-black" /> 
                Save
            </button>
            {!isSearching && (
            <button onClick={() => onDelete(movie.movieId)} disabled={!isSubscribed}
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"> 
                <Trash2 className="w-4 h-4 mr-1 stroke-black" /> 
                Delete
            </button>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="border border-gray-400 text-gray-800 py-1 px-6 rounded-xl hover:bg-gray-100 text-sm">
              Close
            </button>
          </div>
            {children && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2  text-purple-800 px-4 py-2 rounded shadow text-sm z-50">
                {children}
            </div>
            )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default MovieModal;