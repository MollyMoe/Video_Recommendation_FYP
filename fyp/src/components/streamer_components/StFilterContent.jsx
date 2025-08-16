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
  const savedUser = JSON.parse(localStorage.getItem("user"));

  const userId = (savedUser?.userId ?? "").toString();

  // ---- helpers ----
  const normalizeMovie = (movie) => {
    if (!movie) return null;
    const copy = { ...movie };

    if (typeof copy.genres === "string") {
      copy.genres = copy.genres.split(/[,|]/).map((g) => g.trim());
    }
    const match = copy.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    copy.trailer_key = match ? match[1] : copy.trailer_key ?? null;

    const num = parseFloat(copy.predicted_rating);
    copy.predicted_rating = Number.isFinite(num) ? num : 0;

    return copy;
  };

  const pickTop10 = (list = []) =>
    [...list]
      .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
      .slice(0, 10);

  // computed for the "Top 10 Rated..." block
  const sortedByRating = useMemo(() => {
    const list = (movies || []).map(normalizeMovie);
    return [...list].sort(
      (a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0)
    );
  }, [movies]);

  // ---- single online/offline toggle ----
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  // ---- OFFLINE: always load Top-10 (shared with Home) ----
  const loadOfflineTop10 = async () => {
    // 1) prefer the dedicated top10 file (kept in sync by syncOfflineCache / settings flow)
    const top10 = await window.electron?.getTopRatedMovies?.(userId);
    
    if (top10?.length) {
      setMovies(top10.map(normalizeMovie).filter(Boolean));
      return;
    }
    // 2) fallback: compute from recommended pool
    const recs = (await window.electron?.getRecommendedMovies?.(userId)) || [];
    const normalized = recs.map(normalizeMovie).filter(Boolean);
    setMovies(pickTop10(normalized));
  };

  useEffect(() => {
    if (!isOnline && !submittedQuery.trim()) {
      loadOfflineTop10();
    }
  }, [isOnline, submittedQuery, setMovies]);

  useEffect(() => {
    const onUpdated = () => {
      if (!navigator.onLine && !submittedQuery.trim()) {
        loadOfflineTop10();
      }
    };
    window.addEventListener("cineit:filterDataUpdated", onUpdated);
    return () => window.removeEventListener("cineit:filterDataUpdated", onUpdated);
  }, [submittedQuery, setMovies]);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        if (isOnline && savedUser?.userId && !submittedQuery.trim()) {
          const res = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
          const list = (res.data || []).map(normalizeMovie);
          setMovies(list);
          window.electron?.saveRecommendedMovies?.(list, userId);
          const topTen = [...list]
          .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
          .slice(0, 10);
          window.electron?.saveTopRatedMovies?.(topTen, userId)
        }
      } catch (e) {
        console.warn("Failed to fetch online recommendations:", e);
      }
    };
    fetchOnline();
  }, [isOnline, submittedQuery, savedUser?.userId]);


  const getFullMovie = async (movieId) => {
    const id = String(movieId);
    let full = movies.find((m) => String(m.movieId) === id) || null;
    if (!full && window.electron?.getRecommendedMovies) {
      const pool = await window.electron.getRecommendedMovies(userId);
      full = pool.find((m) => String(m.movieId) === id) || null;
    }
    return normalizeMovie(full || { movieId: id, title: `Movie #${id}`, poster_url: "" });
  };

  const handleAction = async (actionType, movieId) => {
  if (!movieId || !savedUser?.userId) return;

  const actions = {
    history: { url: "history", message: null },
    like:    { url: "like", message: "Movie Liked!" },
    save:    { url: "watchLater", message: "Saved to Watch Later!" },
    delete:  { url: "recommended/delete", message: "Removed from recommendations" },
  };
  const action = actions[actionType];
  if (!action) return;
  if (actionType === "delete") {
  const mid = String(movieId);

  const idOf = (m) => String(m?.movieId ?? m?._id ?? m?.tmdb_id ?? m?.title ?? "");
  // 1) Update UI immediately
  setMovies(prev => prev.filter(m => idOf(m) !== mid));

  onDeleteMovie?.(mid);

  // 2) Persist (offline cache + server/queue)
  try {
    if (!isOnline) {
      await window.electron?.removeFromRecommended?.(mid); // update recommended.json
      window.electron?.queueRecommendedAction?.({ type: "delete", movieId: mid }); // <-- fixed 'electrob' typo
    } else {
      await axios.post(`${API}/api/movies/recommended/delete`, {
        userId: savedUser.userId,
        movieId: mid,
      });
      // keep offline cache consistent even when online
      await window.electron?.removeFromRecommended?.(mid);
    }
  } catch (e) {
    // if online failed, queue for later
    if (isOnline) {
      window.electron?.queueRecommendedAction?.({ type: "delete", movieId: mid });
    }
    console.warn("❌ delete sync issue:", e);
  }

  // 3) Toast + optional offline refresh
  setPopupMessage("Removed from recommendations");
  setShowPopup(true);
  setTimeout(() => setShowPopup(false), 2000);

  if (!isOnline && !submittedQuery.trim()) {
    window.dispatchEvent(new Event("cineit:filterDataUpdated"));
  }
  return;
}

  // OFFLINE SAVE
  if (!isOnline && actionType === "save") {
    try {
      window.electron?.queueSavedAction?.({ type: "add", movieId: String(movieId) });
      const full = await getFullMovie(movieId);
      if (window.electron?.getSavedSnapshot && window.electron?.saveSavedSnapshot) {
        const snap = window.electron.getSavedSnapshot() || [];
        const seen = new Set(snap.map(m => String(m.movieId ?? m._id)));
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

  // OFFLINE LIKE
  if (!isOnline && actionType === "like") {
    try {
      const full = await getFullMovie(movieId);
      window.electron?.queueLiked?.({ type: "add", movie: full });
      window.electron?.addMovieToLikedList?.(full);
      setPopupMessage("Movie Liked! (offline)");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (e) {
      console.warn("❌ Offline like failed:", e);
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
        const seen = new Set(snap.map(m => String(m.movieId ?? m._id)));
        if (!seen.has(String(movieId))) {
          window.electron.saveSavedSnapshot([full, ...snap]);
        }
      }
    }

    if (actionType === "like") {
      const full = await getFullMovie(movieId);
      window.electron?.addMovieToLikedList?.(full);
    }

    setPopupMessage(action.message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  } catch (err) {
    console.error(`❌ Error with action ${actionType}:`, err);
  }
}

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


  return (
    <div className="bg-white pt-24 sm:pt-20 px-4 sm:px-8 dark:bg-gray-900 min-h-screen w-full mt-40">
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 dark-bg-900">
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
                          ? movie.genres.filter(Boolean).join(", ")
                          : String(movie.genres || "")
                              .split(/[|,]/)
                              .map(s => s.trim())
                              .filter(Boolean)
                              .join(", ") || "Movie"}
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