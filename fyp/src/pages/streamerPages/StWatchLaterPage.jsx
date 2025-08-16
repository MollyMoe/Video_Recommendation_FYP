
import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";
import { CheckCircle } from "lucide-react";
import { API } from "@/config/api";

// ✅ helper: always read the *current* user
const getUser = () => JSON.parse(localStorage.getItem("user"));

const StWatchLaterPage = () => {
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const OWNER_KEY = "saved_owner_userId";

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

  // 🔒 Clear another user's offline data on first mount
  useEffect(() => {
    const u = getUser();
    const uid = u?.userId || "";
    const prev = localStorage.getItem(OWNER_KEY);
    if (uid && prev && prev !== uid) {
      window.electron?.clearSavedSnapshot?.();
      window.electron?.clearSavedQueue?.();
    }
    localStorage.setItem(OWNER_KEY, uid);
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

  // ✅ Fetch saved movies (watch later) with owner guard
  const fetchWatchLaterMovies = async (userId) => {
    if (!userId) return;

    // 🔒 Check if offline saved list belongs to this user
    const prevOwner = localStorage.getItem(OWNER_KEY);
    if (prevOwner && prevOwner !== userId) {
      window.electron?.saveSavedSnapshot?.([]);
      window.electron?.clearSavedQueue?.();
    }
    localStorage.setItem(OWNER_KEY, userId);

    setIsLoading(true);
    const start = Date.now();
    const minDelay = 500;

    try {
      let savedList = [];
      if (isOnline) {
        const res = await fetch(`${API}/api/movies/watchLater/${userId}`, {
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();
        const raw = Array.isArray(data.SaveMovies) ? data.SaveMovies : [];

        if (raw.length === 0) {
          window.electron?.saveSavedSnapshot?.([]);
          window.electron?.clearSavedQueue?.();
        } else {
          window.electron?.saveSavedSnapshot?.(raw);
        }
        savedList = raw;
      } else {
        savedList = window.electron?.getSavedSnapshot?.() ?? [];
        if (!savedList.length) {
          savedList = window.electron?.getSavedQueue?.() || [];
        }
      }

      // ✅ Ensure unique IDs
      const seen = new Set();
      const unique = savedList.filter((m) => {
        const id = m?._id || m?.movieId;
        if (id && !seen.has(id)) {
          seen.add(id);
          return true;
        }
        return false;
      });

      setWatchLaterMovies(unique);
    } catch (err) {
      console.error("❌ Failed to fetch watch later movies:", err);
    } finally {
      const elapsed = Date.now() - start;
      setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
    }
  };

  // ✅ On first mount
  useEffect(() => {
    const u = getUser();
    if (u?.userId) {
      fetchWatchLaterMovies(u.userId);
      fetchSubscription(u.userId);
    }
  }, []);

  // ✅ When user comes online
  useEffect(() => {
    const u = getUser();
    if (isOnline && u?.userId) {
      fetchWatchLaterMovies(u.userId);
    }
  }, [isOnline]);

  // ✅ Sync offline saved queue (add/delete) when online
  useEffect(() => {
    const syncSavedQueue = async () => {
      const u = getUser();
      if (!u?.userId || !window.electron?.getRawSavedQueue) return;

      const saved = window.electron.getRawSavedQueue() || [];
      for (const action of saved) {
        try {
          if (action.type === "delete") {
            await fetch(`${API}/api/movies/watchLater/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: u.userId, movieId: action.movieId }),
            });
          } else if (action.type === "add") {
            const id = action.movieId || action.movie?.movieId || action.movie?._id;
            if (id) {
              await fetch(`${API}/api/movies/watchLater`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: u.userId, movieId: String(id) }),
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
    const u = getUser();
    if (!movieId || !u?.userId) return;

    if (!trailerUrl) {
      alert("No trailer available.");
      return;
    }

    let newTab = window.open("", "_blank");
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.userId, movieId }),
      });
      if (newTab) newTab.location.href = trailerUrl;
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };

  // ✅ Handle remove saved movie
  const handleRemove = async (movieId) => {
    const u = getUser();
    if (!movieId || !u?.userId) return;

    // Optimistic UI
    setWatchLaterMovies((prev) =>
      prev.filter((m) => String(m.movieId ?? m._id) !== String(movieId))
    );

    // Prune local snapshot immediately so it won't reappear offline
    const snap = window.electron?.getSavedSnapshot?.() || [];
    const updated = snap.filter(
      (m) => String(m?.movieId ?? m?._id) !== String(movieId)
    );
    window.electron?.saveSavedSnapshot?.(updated);

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
        body: JSON.stringify({ userId: u.userId, movieId }),
      });
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
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  No saved movies found.
                </p>
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