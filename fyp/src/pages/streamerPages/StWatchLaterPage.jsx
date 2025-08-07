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
        console.log("🔑 Online subscription data:", subscription);
        window.electron?.saveSubscription(subscription);
      } else {
        const offlineSub = window.electron?.getSubscription();
        subscription = offlineSub?.userId === userId ? offlineSub : null;
        console.log("📦 Offline subscription data:", subscription);
      }

      setIsSubscribed(subscription?.isActive ?? false);
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
    const minDelay = 500; // so spinner doesn’t flash too fast
  
    try {
      let savedList = [];
  
      if (isOnline) {
        // ✅ 1. Try fetching from API
        const res = await fetch(`${API}/api/movies/watchLater/${userId}`);
        const data = await res.json();
        console.log("🌐 Online response from API:", data);
  
        // ✅ 2. Handle different response shapes
        savedList = Array.isArray(data.SaveMovies)
          ? data.SaveMovies
          : Array.isArray(data.savedMovies)
          ? data.savedMovies
          : [];
  
        // ✅ 3. Save to preload cache
        window.electron?.saveSavedQueue?.(savedList);
      } else if (window.electron?.getSavedQueue) {
        // ✅ 4. Offline: read from cache
        const offlineQueue = await window.electron.getSavedQueue();
        console.log("📦 Offline Saved Queue:", offlineQueue);
  
        savedList = (offlineQueue || []).filter(
          (movie) => movie && (movie._id || movie.movieId) && movie.title
        );
      } else {
        console.warn("⚠️ Offline and no preload getSavedQueue available");
      }
  
      // ✅ 5. Deduplicate robustly
      const uniqueMovies = [];
      const seen = new Set();
  
      for (const movie of savedList) {
        const id =
          movie._id?.toString() ||
          movie.movieId?.toString() ||
          movie.tmdb_id?.toString() ||
          movie.title?.toString();
  
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        } else {
          console.warn("⚠️ Skipped duplicate or invalid movie:", movie);
        }
      }
  
      console.log("🎯 Final saved movies before render:", uniqueMovies);
      setWatchLaterMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch watch later movies:", err);
    } finally {
      // ✅ Ensure spinner stays at least 500ms
      const elapsed = Date.now() - start;
      setTimeout(() => {
        setIsLoading(false);
      }, Math.max(0, minDelay - elapsed));
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
      if (!savedUser?.userId) return;
      const saved = window.electron.getRawSavedQueue?.() || [];

      for (const action of saved) {
        try {
          if (action.type === "delete") {
            await fetch(`${API}/api/movies/watchLater/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: savedUser.userId,
                movieId: action.movieId,
              }),
            });
          } else if (action.type === "add" && action.movie) {
            await fetch(`${API}/api/movies/watchLater`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: savedUser.userId,
                movie: action.movie,
              }),
            });
          }
        } catch (err) {
          console.warn("❌ Failed to sync saved movie:", err);
        }
      }

      window.electron.clearSavedQueue?.();
      console.log("✅ Synced saved queue");
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

    console.log("▶️ Trailer URL:", trailerUrl);
    let newTab = window.open("", "_blank");

    try {
      const res = await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save to history");

      if (newTab) newTab.location.href = trailerUrl;
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };

  // ✅ Handle remove saved movie
  const handleRemove = async (movieId) => {
    if (!movieId || !savedUser?.userId) return;

    // 1. Remove from UI
    setWatchLaterMovies((prev) =>
      prev.filter((m) => m.movieId?.toString() !== movieId.toString())
    );
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // 2. Offline mode
    if (!isOnline) {
      window.electron?.removeFromSavedQueue?.(movieId);
      window.electron?.queueSavedAction?.({ type: "delete", movieId });
      return;
    }

    // 3. Online delete
    try {
      const res = await fetch(`${API}/api/movies/watchLater/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId,
        }),
      });

      if (!res.ok) throw new Error(`❌ Server error`);

      console.log("🗑️ Removed from Watch Later (online)");
    } catch (err) {
      console.error(
        "❌ Failed to remove from Watch Later:",
        err.message || err
      );
      alert("Could not remove movie. Try again later.");
    }
  };

  return (
    <div className="p-4">
      <StNav />

      <StSideBar />
      <div className="sm:ml-64 pt-20 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {watchLaterMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No saved movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading Watch Later Movies</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-violet-500" />
            </div>
            <span className="font-medium">
              Movie removed from Watch Later list!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StWatchLaterPage;
