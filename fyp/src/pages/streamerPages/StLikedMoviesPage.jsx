import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";

import { API } from "@/config/api";

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
        console.log("🔑 Online subscription data:", subscription);

        // Save for offline use (entire object)
        window.electron?.saveSubscription(subscription);
      } else {
        const offlineSub = window.electron?.getSubscription();
        subscription = offlineSub?.userId === userId ? offlineSub : null;
        console.log("📦 Offline subscription data:", subscription);
      }

      setIsSubscribed(Boolean(subscription?.isActive));
      console.log("✅ isOnline:", isOnline);
      console.log("✅ isSubscribed:", isSubscribed, typeof isSubscribed);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setIsSubscribed(false); // fallback
    }
  };

  const fetchLikedMovies = async (userId) => {
    if (!userId) {
      console.warn("❗ No userId provided");
      return;
    }

    setIsLoading(true);
    const start = Date.now();
    const minDelay = 500;

    try {
      let data = { likedMovies: [] };

      if (isOnline) {
        // ✅ Online: fetch from FastAPI
        const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
        data = await res.json();
        console.log("🎬 Liked movies (online):", data);

        // ✅ Save for offline access
        if (window.electron?.saveLikedQueue) {
          window.electron.saveLikedQueue(data.likedMovies);
        }
      } else if (window.electron?.getLikedQueue) {
        // ✅ Offline: use normalized liked queue (movies array)
        const offlineMovies = window.electron.getLikedQueue();
        console.log("📦 Offline liked movies (normalized):", offlineMovies);
        data.likedMovies = offlineMovies || [];

        // (Optional debug) If nothing found, peek at raw shape:
        if (!data.likedMovies?.length && window.electron?.getRawLikedQueue) {
          const rawQueue = window.electron.getRawLikedQueue();
          console.log("🧪 Raw liked queue (fallback view):", rawQueue);
        }
      } else {
        console.warn("⚠️ Offline and no preload getLikedQueue available");
      }

      // ✅ Deduplicate
      const seen = new Set();
      const uniqueMovies = [];

      for (const movie of data.likedMovies || []) {
        const id = movie._id || movie.movieId;
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        }
      }

      setLikedMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch liked movies:", err);
    } finally {
      const elapsed = Date.now() - start;
      setTimeout(() => {
        setIsLoading(false);
      }, Math.max(0, minDelay - elapsed));
    }
  };

  useEffect(() => {
    if (savedUser?.userId) {
      fetchLikedMovies(savedUser.userId);
      fetchSubscription(savedUser.userId);
    }
  }, []);

  const handlePlay = async (movieId, trailerUrl) => {
    if (!movieId || !savedUser?.userId) return;

    console.log("▶️ Trailer URL:", trailerUrl);

    // ✅ Open immediately before async/await
    let newTab = null;
    if (trailerUrl) {
      newTab = window.open("", "_blank"); // open empty tab immediately
    }

    try {
      const res = await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId: movieId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save to history");

      if (newTab && trailerUrl) {
        newTab.location.href = trailerUrl; // ✅ now load trailer
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close(); // if error, close tab
    }
  };

  useEffect(() => {
    const syncLikedDiff = async () => {
      if (!isOnline || !savedUser?.userId) return;
  
      // ✅ Pick the endpoint your backend actually supports:
      const DELETE_URL = `${API}/api/movies/likedMovies/delete`;
      // If your backend only has /api/movies/like/delete, then use:
      // const DELETE_URL = `${API}/api/movies/like/delete`;
  
      try {
        // 1) Fetch server liked list
        const res = await fetch(`${API}/api/movies/likedMovies/${savedUser.userId}`);
        if (!res.ok) throw new Error(`Server liked fetch failed: ${res.status}`);
        const payload = await res.json();
        const serverLiked = Array.isArray(payload?.likedMovies) ? payload.likedMovies : [];
  
        // 2) Load local liked list (what the user wants after offline edits)
        const localLiked = window.electron?.getLikedQueue?.() || [];
  
        // 3) Normalize IDs and build sets
        const getId = (m) => (m?._id ?? m?.movieId ?? "").toString();
        const serverSet = new Set(serverLiked.map(getId));
        const localSet  = new Set(localLiked.map(getId));
  
        // 4) Anything on server but NOT locally = deleted offline → delete on server
        const toDelete = [...serverSet].filter((id) => !localSet.has(id));
  
        for (const movieId of toDelete) {
          try {
            const delRes = await fetch(DELETE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: savedUser.userId,
                movieId,
              }),
            });
            if (!delRes.ok) {
              const t = await delRes.text();
              console.warn("❌ Delete failed for", movieId, delRes.status, t);
            }
          } catch (e) {
            console.warn("❌ Delete error for", movieId, e);
          }
        }
  
        // 5) Refresh UI (and offline cache) from server truth
        await fetchLikedMovies(savedUser.userId);
        console.log("✅ Synced liked via diff");
      } catch (e) {
        console.error("❌ Liked diff sync failed:", e);
      }
    };
  
    syncLikedDiff();
  }, [isOnline]);
  

  const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!movieId || !savedUser?.userId) {
      console.warn("⚠️ Missing movieId or userId");
      return;
    }

    // ✅ Always remove from UI first
    // setLikedMovies((prev) =>
    //   prev.filter((m) => m.movieId?.toString() !== movieId.toString())
    // );

    setLikedMovies((prev) =>
      prev.filter((m) => ((m._id || m.movieId)?.toString() !== movieId.toString()))
    );
    

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // ✅ OFFLINE mode: remove from local queue only
    if (!isOnline) {
      console.log("🛠 Offline — removing from local liked queue only");
      window.electron?.removeFromLikedQueue?.(movieId);
      return;
    }

    // ✅ ONLINE mode: remove from backend
    try {
      const res = await fetch(`${API}/api/movies/likedMovies/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("🗑️ Removed from backend:", data);
    } catch (err) {
      console.error("❌ Error removing liked movie:", err.message || err);
      alert("Failed to remove from server. Please try again later.");
    }
  };

  return (
    <div className="p-4">
      <StNav />
      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {likedMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No liked movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {likedMovies.map((movie) => (
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
            <p className="text-lg font-semibold">Loading Liked Movies</p>
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
            <span className="font-medium">Movie removed from liked list!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StLikedMoviesPage;
