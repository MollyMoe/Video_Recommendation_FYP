import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import MovieModal from "../movie_components/MovieModal";
import MovieCard from "../movie_components/MovieCard";
import offlineFallback from "../../images/offlineFallback.jpg";
import { API } from "@/config/api";

const StFilterContent = ({
  submittedQuery,
  movies,
  isLoading,
  isSearching,
  setMovies,
  onDeleteMovie,
}) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // normalize one movie object
  const normalizeMovie = (movie) => {
    if (!movie) return null;
    const copy = { ...movie };

    // genres as array
    if (typeof copy.genres === "string") {
      copy.genres = copy.genres.split(/[,|]/).map((g) => g.trim());
    }

    // trailer_key
    const match = copy.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    copy.trailer_key = match ? match[1] : copy.trailer_key ?? null;

    // rating must be a number for sorting/display
    if (copy.predicted_rating !== undefined && copy.predicted_rating !== null) {
      const num = parseFloat(copy.predicted_rating);
      copy.predicted_rating = Number.isFinite(num) ? num : 0;
    } else {
      copy.predicted_rating = 0;
    }

    return copy;
  };

  // sorted copy by rating (desc)
  const sortedByRating = useMemo(() => {
    const list = (movies || []).map(normalizeMovie);
    return [...list].sort(
      (a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0)
    );
  }, [movies]);

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
  }, [isOnline, setMovies]);

  const savedUser = JSON.parse(localStorage.getItem("user"));

  const getFullMovie = async (movieId) => {
    const id = String(movieId);
    let full = movies.find((m) => String(m.movieId) === id) || null;
    if (!full && window.electron?.getRecommendedMovies) {
      try {
        const pool = await window.electron.getRecommendedMovies();
        full = pool.find((m) => String(m.movieId) === id) || null;
      } catch {
        /* ignore */
      }
    }
    return normalizeMovie(full || { movieId: id, title: `Movie #${id}`, poster_url: "" });
  };

  const handleAction = async (actionType, movieId) => {
    if (!movieId || !savedUser?.userId) return;

    const actions = {
      history: { url: "history", message: null },
      like: { url: "like", message: "Movie Liked!" },
      save: { url: "watchLater", message: "Saved to Watch Later!" },
      delete: { url: "recommended/delete", message: "Removed from recommendations" },
    };
    const action = actions[actionType];
    if (!action) return;

    // DELETE: update UI immediately, then sync/queue
    if (actionType === "delete") {
      onDeleteMovie?.(movieId);

      if (isOnline) {
        try {
          await axios.post(`${API}/api/movies/recommended/delete`, {
            userId: savedUser.userId,
            movieId: String(movieId),
          });
        } catch (e) {
          try {
            window.electron?.queueRecommendedAction?.({
              type: "delete",
              movieId: String(movieId),
            });
          } catch {}
        }
      } else {
        try {
          window.electron?.queueRecommendedAction?.({
            type: "delete",
            movieId: String(movieId),
          });
        } catch {}
      }

      setPopupMessage(action.message);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    // OFFLINE SAVE (early return)
    if (!isOnline && actionType === "save") {
      try {
        window.electron?.queueSavedAction?.({ type: "add", movieId: String(movieId) });
        const full = await getFullMovie(movieId);

        if (window.electron?.getSavedSnapshot && window.electron?.saveSavedSnapshot) {
          const snap = window.electron.getSavedSnapshot() || [];
          const seen = new Set(snap.map((m) => String(m.movieId ?? m._id)));
          if (!seen.has(String(movieId))) {
            window.electron.saveSavedSnapshot([full, ...snap]);
          }
        }

        setPopupMessage("Saved to Watch Later! (offline)");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      } catch (e) {
        console.warn("❌ Offline save failed:", e);
      }
      return;
    }

    // ONLINE / OTHER actions
    try {
      await axios.post(`${API}/api/movies/${action.url}`, {
        userId: savedUser.userId,
        movieId: String(movieId),
      });

      if (actionType === "save") {
        const full = await getFullMovie(movieId);
        if (full && window.electron?.getSavedSnapshot && window.electron?.saveSavedSnapshot) {
          const snap = window.electron.getSavedSnapshot() || [];
          const seen = new Set(snap.map((m) => String(m.movieId ?? m._id)));
          if (!seen.has(String(movieId))) {
            window.electron.saveSavedSnapshot([full, ...snap]);
          }
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
      handleAction("history", movie.movieId);
    } else {
      window.electron?.addToQueue("historyQueue", {
        userId: savedUser.userId,
        movieId: movie.movieId,
        action: "history",
      });
    }
    if (movie.trailer_url) window.open(movie.trailer_url, "_blank");
  };

  useEffect(() => {
  const reload = async () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (navigator.onLine && savedUser?.userId) {
        const res = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
        setMovies((res.data || []).map(normalizeMovie));
      } else if (window.electron?.getRecommendedMovies) {
        const [offline, genres] = await Promise.all([
          window.electron.getRecommendedMovies(),
          window.electron.getUserGenres?.() || [],
        ]);
        const hasAll = (gs) => {
          const arr = Array.isArray(gs) ? gs : String(gs || "").split(/[,|]/).map(s => s.trim());
          return genres.length ? genres.every(g => arr.includes(g)) : false;
        };
        setMovies((offline || []).filter(m => hasAll(m.genres)).map(normalizeMovie));
      }
    } catch (e) {
      console.warn("Failed to reload filter data", e);
    }
  };
  window.addEventListener("cineit:filterDataUpdated", reload);
  return () => window.removeEventListener("cineit:filterDataUpdated", reload);
}, [setMovies]);

useEffect(() => {
  const loadOffline = async () => {
    if (!isOnline && window.electron?.getRecommendedMovies) {
      const [offline, genres] = await Promise.all([
        window.electron.getRecommendedMovies(),
        window.electron.getUserGenres?.() || [],
      ]);
      const hasAll = (gs) => {
        const arr = Array.isArray(gs) ? gs : String(gs || "").split(/[,|]/).map(s => s.trim());
        return genres.length ? genres.every(g => arr.includes(g)) : false;
      };
      setMovies((offline || []).filter(m => hasAll(m.genres)).map(normalizeMovie));
    }
  };
  loadOffline();
}, [isOnline, setMovies]);

  return (
    <div className="pt-24 sm:pt-20 px-4 sm:px-8 dark:bg-gray-900 min-h-screen mt-40">
      {isSearching && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Searching for Movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {!isSearching &&
        (submittedQuery.trim() ? (
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
          <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Top 10 Rated Movies Based On Your Recommendations
            </h2>
            <div className="w-full max-w-2xl ml-0">
              {sortedByRating.length > 0 ? (
                <div className="space-y-4">
                  {sortedByRating.slice(0, 10).map((movie, index) => (
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
                          {Array.isArray(movie.genres)
                            ? movie.genres[0]
                            : String(movie.genres || "Movie").split(",")[0]}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2 pr-2">
                        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                        <div className="flex flex-col items-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {Number.isFinite(movie.predicted_rating)
                              ? movie.predicted_rating.toFixed(1)
                              : "N/A"}
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
                    No recommended movies found.
                    <br />
                    Like some movies to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

      <MovieModal
        isOpen={!!selectedMovie}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={(m) => handleHistory(m)}
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
