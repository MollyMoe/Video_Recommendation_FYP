import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";
import { Play, Trash2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { API } from "@/config/api";

const getId = (m) => (m?._id ?? m?.movieId ?? "").toString();

const StHistoryPage = () => {
  const [historyMovies, setHistoryMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

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
      setIsSubscribed(false); // fallback
    }
  };

  const fetchHistoryMovies = async (userId, options = { showLoader: true }) => {
    if (!userId) return;

    const start = Date.now();
    const minDelay = 500;

    if (options.showLoader) {
      setIsLoading(true);
    }

    try {
      let historyList = [];
      if (isOnline) {
        const res = await fetch(`${API}/api/movies/historyMovies/${userId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Server fetch failed: ${res.status}`);
        const payload = await res.json().catch(() => ({ historyMovies: [] }));
        historyList = Array.isArray(payload?.historyMovies) ? payload.historyMovies : [];
        window.electron?.saveHistorySnapshot?.(historyList);
      } else {
        historyList = window.electron?.getHistorySnapshot?.() || [];
      }
      const seen = new Set();
      const uniqueMovies = historyList.filter((movie) => {
        const id = getId(movie);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setHistoryMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch history movies:", err);
      const snap = window.electron?.getHistorySnapshot?.() || [];
      setHistoryMovies(Array.isArray(snap) ? snap : []);
    } finally {
      if (options.showLoader) {
        const elapsed = Date.now() - start;
        setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
      }
    }
  };

  useEffect(() => {
    if (savedUser?.userId) {
      fetchHistoryMovies(savedUser.userId);
      fetchSubscription(savedUser.userId);
    }
  }, [savedUser?.userId]);

  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      const u = JSON.parse(localStorage.getItem("user"));
      if (!u?.userId) return;
      try {
        await window.electron?.syncQueuedHistory?.(API, u.userId);
      } catch (e) {
        console.warn("⚠️ syncQueuedHistory error:", e);
      } finally {
        await fetchHistoryMovies(u.userId);
        await fetchSubscription(u.userId);
      }
    })();
  }, [isOnline]);

  const handlePlay = async (movieId, trailerUrl) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) return;
    console.log("▶️ Trailer URL:", trailerUrl);
    let newTab = null;
    if (trailerUrl) {
      newTab = window.open("", "_blank");
    }
    try {
      const res = await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId: movieId }),
      });
      if (!res.ok) throw new Error("Failed to save to history");
      if (newTab && trailerUrl) {
        newTab.location.href = trailerUrl;
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };

  const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) {
      console.warn("⚠️ Missing movieId or userId");
      return;
    }
    setHistoryMovies((prev) => prev.filter((m) => getId(m) !== String(movieId)));
    window.electron?.removeMovieFromHistoryCache?.(movieId);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    if (!isOnline) {
      window.electron?.removeFromHistoryQueue?.(movieId);
      const snap = window.electron?.getHistorySnapshot?.() || [];
      setHistoryMovies(Array.isArray(snap) ? snap : []);
      return;
    }
    try {
      const res = await fetch(`${API}/api/movies/historyMovies/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }
      await fetchHistoryMovies(savedUser.userId, { showLoader: false });
    } catch (err) {
      console.error("❌ Failed to remove from history online, queueing:", err);
      window.electron?.removeFromHistoryQueue?.(movieId);
    }
  };

  const handleRemoveAllHistory = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser?.userId) return;
    setHistoryMovies([]);
    if (isOnline) {
      try {
        await fetch(`${API}/api/movies/historyMovies/removeAllHistory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: savedUser.userId }),
        });
        await fetchHistoryMovies(savedUser.userId, { showLoader: false });
      } catch (err) {
        console.error("❌ Server clear error:", err);
      }
    } else {
      window.electron?.clearHistorySnapshot?.();
      window.electron?.enqueueHistoryClearAll?.();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <StNav />
      <StSideBar />

      <main className="sm:ml-64 pt-20 bg-white">
        <div className="p-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-end mb-5">
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-white text-gray-800 font-medium border border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-sm shadow-md"
              >
                Remove all History
              </button>
            </div>
            {historyMovies.length === 0 ? (
              <div className="text-center mt-20">
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    No history movies found.
                  </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {historyMovies.map((movie) => (
                  <CompactMovieCard
                    key={getId(movie)}
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

      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-xl text-center">
            <p className="text-lg font-semibold text-gray-900">Loading History Movies</p>
            <div className="mt-3 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-xl text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-9 h-9 text-violet-500" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">Movie removed from history!</span>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="mt-4">
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete all history?
                </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  handleRemoveAllHistory();
                  setShowConfirm(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Yes, clear it all
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white px-5 py-2 rounded-lg font-semibold shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StHistoryPage;