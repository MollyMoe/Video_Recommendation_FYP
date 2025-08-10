import React, { useState, useEffect } from "react";
import axios from "axios";
import { Star } from "lucide-react"; // Make sure to install: npm install lucide-react
import MovieModal from "../movie_components/MovieModal";
import MovieCard from "../movie_components/MovieCard";
import offlineFallback from "../../images/offlineFallback.jpg";

import { API } from "@/config/api";

const StFilterContent = ({ submittedQuery, movies, isLoading, isSearching, setMovies }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
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

useEffect(() => {
  const loadOfflineRecommendations = async () => {
    if (!isOnline && window.electron?.getRecommendedMovies) {
      const offlineMovies = await window.electron.getRecommendedMovies();
      setMovies(offlineMovies);
    }
  };

  loadOfflineRecommendations();
}, [isOnline]);


  const savedUser = JSON.parse(localStorage.getItem("user"));

  const handleAction = async (actionType, movieId) => {
  if (!movieId || !savedUser?.userId) return;
  const actions = {
    history: { url: "history", message: null },
    like: { url: "like", message: "Movie Liked!", queueKey: "likeQueue" },
    save: { url: "watchLater", message: "Saved to Watch Later!", queueKey: "watchLaterQueue" },
    delete: { url: "recommended/delete", message: "Removed from recommendations", queueKey: null }
  };
  const action = actions[actionType];
  if (!action) return;

  if (actionType === "delete") {
    setMovies(prev => prev.filter(m => m.movieId !== movieId));
  }

  try {
    if (isOnline) {
      await axios.post(`${API}/api/movies/${action.url}`, {
        userId: savedUser.userId,
        movieId
      });
    } else {
      if (action.queueKey && window.electron?.addToQueue) {
        await window.electron.addToQueue(action.queueKey, {
          userId: savedUser.userId,
          movieId,
          action: actionType
        });
      }
    }

    if (action.message) {
      setPopupMessage(action.message);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  } catch (err) {
    console.error(`❌ Error with action ${actionType}:`, err);
  }
};

    
  const handleHistory = (movie) => {
  if (!movie) return;

  if (isOnline) {
    handleAction("history", movie.movieId); // optional, if you use API
  } else {
    window.electron?.addToQueue("historyQueue", {
      userId: savedUser.userId,
      movieId: movie.movieId,
      action: "history"
    });
  }

  if (movie.trailer_url) {
    window.open(movie.trailer_url, "_blank");
  }
};


  return (
    <div className="pt-24 sm:pt-20 px-4 sm:px-8 dark:bg-gray-900 min-h-screen mt-40">
      {/* Searching Overlay */}
      {isSearching && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Searching for Movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {/* Only render this when not searching */}
      {!isSearching && (
        submittedQuery.trim() ? (
          // Search Results View
          <div className="relative">
            <h2 className="text-xl text-center mr-25 font-bold text-gray-800 dark:text-gray-200 mb-4">
              Search Results for "{submittedQuery}"
            </h2>
            {movies.length > 0 ? (
              <div className="pl-20">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie._id || movie.movieId}
                      movie={movie}
                      onClick={() => setSelectedMovie(movie)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid place-items-center w-full h-15">
                <p className="text-gray-500 dark:text-gray-400 text-lg mr-20">
                  No movies found matching your search.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Top 10 Recommendations View
          <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Top 10 Rated Movies Based On Your Recommendations
            </h2>
            <div className="w-full max-w-2xl ml-0">
              {movies.length > 0 ? (
                <div className="space-y-4">
                  {movies.slice(0, 10).map((movie, index) => (
                    <div
                      key={movie._id || movie.movieId}
                      className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setSelectedMovie(movie)}
                    >
                      <div className="text-2xl font-bold w-12 text-center text-purple-600 dark:text-yellow-400">
                        {index + 1}
                      </div>
                      <img
                        src={movie.poster_url}
                                alt={movie.title || "No title"}
                                loading="lazy"
                                onError={(e) => {
                                  if (e.currentTarget.src !== offlineFallback) {
                                    e.currentTarget.src = offlineFallback;
                                  }
                                }}
                        className="w-16 h-24 object-cover rounded-md ml-2"
                      />
                      <div className="flex-1 min-w-0 ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {movie.title || "Unknown Title"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {movie.genres ? movie.genres.split(",")[0] : "Movie"}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2 pr-2">
                        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                        <div className="flex flex-col items-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {movie.predicted_rating?.toFixed(1) || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid place-items-center w-full h-64">
                  <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
                    No recommended movies found.<br />Like some movies to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Movie Modal stays outside the conditional */}
      <MovieModal
        isOpen={!!selectedMovie}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={handleHistory}
        onLike={() => handleAction("like", selectedMovie?.movieId)}
        onSave={() => handleAction("save", selectedMovie?.movieId)}
        onDelete={() => handleAction("delete", selectedMovie?.movieId)}
        isSubscribed={true}
        isOnline={isOnline}
      >
        {showPopup && popupMessage}
      </MovieModal>
    </div>
  );
};

export default StFilterContent;