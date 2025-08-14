import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";
import { API } from "@/config/api";

const getId = (m) => String(
  m?.movieId ?? m?._id ?? m?.tmdb_id ?? m?.imdb_id ?? m?.title ?? ""
);

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const savedUser = JSON.parse(localStorage.getItem("user"));

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

  const fetchLikedMovies = async (userId) => {
  if (!userId) return;

  // 🔑 Check if offline liked list belongs to this user
  const prevOwner = localStorage.getItem("liked_owner_userId");
  if (prevOwner && prevOwner !== userId) {
    window.electron?.saveLikedList?.([]);
    window.electron?.clearLikedQueue?.();
    setLikedMovies([]);
    localStorage.setItem("liked_owner_userId", userId);
  }

  setIsLoading(true);
  const start = Date.now();
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
      if (!rows.length) {
        rows = window.electron?.getLikedQueue?.() || [];
      }
    }

    // ✅ Ensure unique IDs
    const seen = new Set();
    const unique = rows.filter((m) => {
      const id = getId(m);
      if (id && !seen.has(id)) {
        seen.add(id);
        return true;
      }
      return false;
    });
    setLikedMovies(unique);
  } catch (err) {
    console.error("❌ Failed to fetch liked movies:", err);
  } finally {
    const elapsed = Date.now() - start;
    setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
  }
};

const syncQueuedLikes = async () => {
  try {
    // ⛔ If the queued likes belong to another user, wipe and stop
    const owner = localStorage.getItem("liked_owner_userId");
    if (owner && owner !== savedUser?.userId) {
      window.electron?.clearLikedQueue?.();
      window.electron?.saveLikedList?.([]);
      setLikedMovies([]);
      return;
    }

    const raw = window.electron?.getRawLikedQueue?.() || [];
    if (!raw.length) return;

    const ui = [...likedMovies];
    const seen = new Set(ui.map(getId));

    for (const entry of raw) {
      const m = entry?.movie || entry;
      const id = getId(m);
      if (!id) continue;

      try {
        if (entry?.type === "add") {
          await fetch(`${API}/api/movies/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: savedUser.userId, movieId: id }),
          });
          if (!seen.has(id)) {
            ui.unshift(m);
            seen.add(id);
          }
        } else if (entry?.type === "delete") {
          await fetch(`${API}/api/movies/likedMovies/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: savedUser.userId, movieId: id }),
          });
          const idx = ui.findIndex((mm) => getId(mm) === id);
          if (idx !== -1) ui.splice(idx, 1);
        }
        window.electron?.removeFromLikedQueue?.(id);
      } catch (e) {
        console.warn(`❌ Sync ${entry?.type} failed for`, id, e);
      }
    }

    setLikedMovies(ui);
    window.electron?.saveLikedList?.(ui);
  } catch (err) {
    console.error("❌ syncQueuedLikes error:", err);
  }
};

  
  // Initial load and sync logic
  useEffect(() => {
    const run = async () => {
      if (!savedUser?.userId) return;
      await fetchSubscription(savedUser.userId); // Fetch subscription status
  
      if (isOnline) {
        await syncQueuedLikes();
        await fetchLikedMovies(savedUser.userId);
      } else {
        await fetchLikedMovies(savedUser.userId);
      }
    };
    run();
  }, [isOnline, savedUser?.userId]);

  const handlePlay = async (movieId, trailerUrl) => {
    if (!movieId || !savedUser?.userId) return;

    let newTab = trailerUrl ? window.open("", "_blank") : null;
    
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
      if (newTab && trailerUrl) newTab.location.href = trailerUrl;
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close();
    }
  };
  
  const handleRemove = async (id) => {
    if (!id || !savedUser?.userId) return;
  
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
        body: JSON.stringify({ userId: savedUser.userId, movieId: id }),
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