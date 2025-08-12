import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import { CheckCircle } from "lucide-react";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";
import { API } from "@/config/api";

const getId = (m) => (m?._id ?? m?.movieId ?? m?.tmdb_id ?? "").toString();
const getUser = () => JSON.parse(localStorage.getItem("user"));
const OWNER_KEY = "liked_owner_userId";

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // network watcher
  useEffect(() => {
    const handle = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, []);

  // 🔒 owner guard on mount
  useEffect(() => {
    const u = getUser();
    const uid = u?.userId || "";
    const prev = localStorage.getItem(OWNER_KEY);
    if (uid && prev && prev !== uid) {
      window.electron?.saveLikedList?.([]);
      window.electron?.clearLikedQueue?.();
    }
    localStorage.setItem(OWNER_KEY, uid);
  }, []);

  const fetchSubscription = async (userId) => {
    try {
      let sub;
      if (isOnline) {
        const res = await fetch(`${API}/api/subscription/${userId}`);
        sub = await res.json();
        window.electron?.saveSubscription(sub);
      } else {
        const offlineSub = window.electron?.getSubscription();
        sub = offlineSub?.userId === userId ? offlineSub : null;
      }
      setIsSubscribed(Boolean(sub?.isActive));
    } catch {
      setIsSubscribed(false);
    }
  };

  const fetchLikedMovies = async (userId) => {
    if (!userId) return;

    // ensure snapshot belongs to this user
    const prevOwner = localStorage.getItem(OWNER_KEY);
    if (prevOwner && prevOwner !== userId) {
      window.electron?.saveLikedList?.([]);
      window.electron?.clearLikedQueue?.();
    }
    localStorage.setItem(OWNER_KEY, userId);

    setIsLoading(true);
    const started = Date.now();
    const minDelay = 500;

    try {
      let rows = [];
      if (isOnline) {
        const res = await fetch(`${API}/api/movies/likedMovies/${userId}`, {
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();
        rows = Array.isArray(data?.likedMovies) ? data.likedMovies : [];

        if (rows.length === 0) {
          window.electron?.saveLikedList?.([]);
          window.electron?.clearLikedQueue?.();
        } else {
          window.electron?.saveLikedList?.(rows);
        }
      } else {
        rows = window.electron?.getLikedList?.() ?? [];
        if (!rows.length) rows = window.electron?.getLikedQueue?.() || [];
      }

      const seen = new Set();
      const unique = rows.filter((m) => {
        const id = getId(m);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      setLikedMovies(unique);
    } catch (err) {
      console.error("❌ Failed to fetch liked movies:", err);
    } finally {
      const elapsed = Date.now() - started;
      setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
    }
  };

  const syncQueuedLikes = async () => {
    try {
      const u = getUser();
      const userId = u?.userId;
      if (!userId) return;

      const raw = window.electron?.getRawLikedQueue?.() || [];
      if (!raw.length) return;

      const ui = [...likedMovies];
      const seen = new Set(ui.map(getId));

      for (const entry of raw) {
        const movie = entry?.movie || entry;
        const id = getId(movie);
        if (!id) continue;

        try {
          if (entry?.type === "add") {
            await fetch(`${API}/api/movies/like`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, movieId: id }), // ✅ send id, not object
            });
            if (!seen.has(id)) {
              ui.unshift(movie);
              seen.add(id);
            }
          } else if (entry?.type === "delete") {
            await fetch(`${API}/api/movies/likedMovies/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, movieId: id }),
            });
            const idx = ui.findIndex((mm) => getId(mm) === id);
            if (idx !== -1) ui.splice(idx, 1);
          }
          window.electron?.removeFromLikedQueue?.(id);
        } catch (e) {
          console.warn(`⚠️ Sync ${entry?.type} failed for`, id, e);
        }
      }

      setLikedMovies(ui);
      window.electron?.saveLikedList?.(ui);
    } catch (err) {
      console.error("❌ syncQueuedLikes error:", err);
    }
  };

  // initial load
  useEffect(() => {
    const run = async () => {
      const u = getUser();
      const userId = u?.userId;
      if (!userId) return;

      await fetchSubscription(userId);
      if (isOnline) {
        await syncQueuedLikes();
      }
      await fetchLikedMovies(userId);
    };
    run();
  }, [isOnline]); // userId comes from localStorage each run

  const handlePlay = async (movieId, trailerUrl) => {
    const u = getUser();
    const userId = u?.userId;
    if (!movieId || !userId) return;

    let newTab = trailerUrl ? window.open("", "_blank") : null;
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, movieId }),
      });
      if (newTab && trailerUrl) newTab.location.href = trailerUrl;
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };

  const handleRemove = async (id) => {
    const u = getUser();
    const userId = u?.userId;
    if (!id || !userId) return;

    setLikedMovies((prev) => {
      const next = prev.filter((m) => getId(m) !== id);
      window.electron?.saveLikedList?.(next);
      if (!isOnline) {
        window.electron?.queueLiked?.({ type: "delete", movieId: id });
      }
      return next;
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    if (!isOnline) return;

    try {
      await fetch(`${API}/api/movies/likedMovies/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, movieId: id }),
      });
    } catch (err) {
      console.error("❌ Error removing liked movie:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <StNav />
      <StSideBar />

      <main className="sm:ml-64 pt-20">
        <div className="p-4 sm:px-8">
          <div className="mt-10 max-w-6xl mx-auto">
            {isLoading ? (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white px-6 py-4 rounded-lg shadow-xl text-center">
                  <p className="text-lg font-semibold text-gray-900">Loading Liked Movies</p>
                  <div className="mt-3 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                </div>
              </div>
            ) : likedMovies.length === 0 ? (
              <div className="text-center mt-20">
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  No like movies found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {likedMovies.map((movie) => (
                  <CompactMovieCard
                    key={getId(movie)}
                    movie={movie}
                    isSubscribed={isSubscribed}
                    isOnline={isOnline}
                    onPlay={handlePlay}
                    onRemove={() => handleRemove(getId(movie))}
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
              Movie removed from liked list!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StLikedMoviesPage;
