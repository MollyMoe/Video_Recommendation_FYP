import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";

import { Play, Trash2, CheckCircle } from "lucide-react";
import { API } from "@/config/api";

// ✅ Define once globally
const savedUser = JSON.parse(localStorage.getItem("user"));

const StWatchLaterPage = () => {
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ✅ Watch network change
  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  // ✅ Fetch subscription
  const fetchSubscription = async (userId) => {
    try {
      let subscription;

      if (isOnline) {
        const res = await fetch(`${API}/api/subscription/${userId}`);
        subscription = await res.json();
        window.electron?.saveSubscription(subscription);
      } else {
        const offlineSub = window.electron?.getSubscription();
        subscription = offlineSub?.userId === userId ? offlineSub : null;
      }
      setIsSubscribed(Boolean(subscription?.isActive));
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setIsSubscribed(false);
    }
  };

  // ✅ Fetch saved movies (watch later)
  const fetchWatchLaterMovies = async (userId) => {
    if (!userId) return;

    setIsLoading(true);
    const start = Date.now();
    const minDelay = 500;

    try {
      let savedList = [];

      if (isOnline) {
        // 1) fetch from API
        const res = await fetch(`${API}/api/movies/watchLater/${userId}`);
        const data = await res.json();

        // 2) normalize payload (objects or IDs)
        const raw = Array.isArray(data.SaveMovies)
          ? data.SaveMovies
          : Array.isArray(data.savedMovies)
          ? data.savedMovies
          : [];

        const normalizeMovie = (movie) => {
          if (!movie) return null;
          if (typeof movie.genres === "string") {
            movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
          }
          const match = movie.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
          movie.trailer_key = match ? match[1] : null;
          return movie;
        };

        if (raw.length && typeof raw[0] === "object" && (raw[0].title || raw[0].poster_url)) {
          // API returned objects
          savedList = raw.map(normalizeMovie).filter(Boolean);
        } else {
          // API returned IDs
          const ids = raw
            .map((x) =>
              typeof x === "string" || typeof x === "number"
                ? String(x)
                : String(x?.movieId ?? x?._id ?? x?.tmdb_id ?? "")
            )
            .filter(Boolean);

          let pool = (await window.electron?.getRecommendedMovies?.()) || [];
          
          savedList = ids.map((id) => {
            const found = pool.find((m) => String(m.movieId) === String(id));
            return found || { movieId: String(id), title: `Movie #${id}`, poster_url: "" };
          });
          
          const isPlaceholder = (m) => !m?.title || /^Movie #/.test(m.title) || !m?.poster_url;
          
          const missingIds = ids.filter(
            (id) => !savedList.find((m) => String(m.movieId) === String(id) && !isPlaceholder(m))
          );

          if (missingIds.length) {
            try {
              const batchRes = await fetch(`${API}/api/movies/details/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: missingIds }),
              });

              if (batchRes.ok) {
                const fetchedDetails = (await batchRes.json() || []).map(normalizeMovie).filter(Boolean);
                if (fetchedDetails.length) {
                  const byId = new Map(savedList.map((m) => [String(m.movieId), m]));
                  for (const m of fetchedDetails) {
                    const key = String(m?.movieId ?? m?._id);
                    if (key) byId.set(key, m);
                  }
                  savedList = Array.from(byId.values());
                }
              }
            } catch (e) {
              console.warn("⚠️ Couldn’t fetch details for missing IDs:", missingIds, e);
            }
          }
        }

        // 3) save snapshot for offline UI
        window.electron?.saveSavedSnapshot?.(savedList);

      } else if (window.electron?.getSavedSnapshot) {
        // offline
        const offlineObjects = await window.electron.getSavedSnapshot();
        savedList = offlineObjects || [];
      }

      // 4) dedupe
      const uniqueMovies = [];
      const seen = new Set();
      for (const movie of savedList) {
        const id = movie._id?.toString() || movie.movieId?.toString();
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        }
      }
      
      setWatchLaterMovies(uniqueMovies);

    } catch (err) {
      console.error("❌ Failed to fetch watch later movies:", err);
    } finally {
      const elapsed = Date.now() - start;
      setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
    }
  };
  
  // ✅ On first mount
  useEffect(() => {
    if (savedUser?.userId) {
      fetchWatchLaterMovies(savedUser.userId);
      fetchSubscription(savedUser.userId);
    }
  }, []);

  // ✅ When user comes online
  useEffect(() => {
    if (isOnline && savedUser?.userId) {
      console.log("🔁 Re-fetching saved queue after online...");
      fetchWatchLaterMovies(savedUser.userId);
    }
  }, [isOnline]);

  // ✅ Sync offline saved queue (add/delete)
  useEffect(() => {
    const syncSavedQueue = async () => {
      if (!savedUser?.userId || !window.electron?.getRawSavedQueue) return;
      const saved = window.electron.getRawSavedQueue() || [];

      for (const action of saved) {
        try {
          if (action.type === "delete") {
            await fetch(`${API}/api/movies/watchLater/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: savedUser.userId, movieId: action.movieId }),
            });
          } else if (action.type === "add") {
            const id = action.movieId || action.movie?.movieId || action.movie?._id;
            if (id) {
              await fetch(`${API}/api/movies/watchLater`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: savedUser.userId, movieId: String(id) }),
              });
            }
          }
        } catch (err) {
          console.warn("❌ Failed to sync saved movie:", err);
        }
      }

      window.electron.clearSavedQueue?.();
    };

    if (isOnline) syncSavedQueue();
  }, [isOnline]);

  // ✅ Handle play trailer
  const handlePlay = async (movieId, trailerUrl) => {
    if (!movieId || !savedUser?.userId) return;

    if (!trailerUrl) {
      alert("No trailer available.");
      return;
    }
    
    let newTab = window.open("", "_blank");

    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
      if (newTab) newTab.location.href = trailerUrl;
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };

  // ✅ Handle remove saved movie
  const handleRemove = async (movieId) => {
    if (!movieId || !savedUser?.userId) return;

    setWatchLaterMovies((prev) => prev.filter((m) => String(m.movieId) !== String(movieId)));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    if (!isOnline) {
      window.electron?.removeFromSavedQueue?.(movieId);
      window.electron?.queueSavedAction?.({ type: "delete", movieId });
      return;
    }

    try {
      await fetch(`${API}/api/movies/watchLater/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });

      const snap = window.electron?.getSavedSnapshot?.() || [];
      const updated = snap.filter((m) => String(m?.movieId ?? m?._id) !== String(movieId));
      window.electron?.saveSavedSnapshot?.(updated);
    } catch (err) {
      console.error("❌ Failed to remove saved movie:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <StNav />
      <StSideBar />

      <main className="sm:ml-64 pt-20">
        <div className="p-4 sm:px-8">
            <div className="max-w-6xl mx-auto mt-10">
                {isLoading ? (
                    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white px-6 py-4 rounded-lg shadow-xl text-center">
                            <p className="text-lg font-semibold text-gray-900">Loading Watch Later</p>
                            <div className="mt-3 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                        </div>
                    </div>
                ) : watchLaterMovies.length === 0 ? (
                    <div className="text-center mt-20">
                        <p className="text-lg text-gray-500 dark:text-gray-400">Your watch later list is empty.</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Movies you save will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {watchLaterMovies.map((movie) => (
                            <CompactMovieCard
                            key={movie._id || movie.movieId}
                            movie={movie}
                            isSubscribed={isSubscribed}
                            isOnline={isOnline}
                            onPlay={handlePlay}
                            onRemove={handleRemove}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-xl text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-9 h-9 text-violet-500" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Movie removed from Watch Later!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StWatchLaterPage;