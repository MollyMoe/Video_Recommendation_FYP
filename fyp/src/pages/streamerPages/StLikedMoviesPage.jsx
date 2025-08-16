
import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";

import { API } from "@/config/api";
const getId = (m) => (m?._id ?? m?.movieId ?? "").toString();

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
      let rows = [];
  
      if (isOnline) {
        // 🌐 ONLINE: server is the truth. Do NOT merge with cache/queue here.
        const res = await fetch(`${API}/api/movies/likedMovies/${userId}`, {
          headers: { "Cache-Control": "no-store" }
        });
        const data = await res.json();
        console.log("🎬 Liked movies (online raw):", data);
  
        rows = Array.isArray(data?.likedMovies) ? data.likedMovies : [];
  
        // 🔒 Overwrite snapshot with server list so cache matches latest DB
        window.electron?.saveLikedList?.(rows);
      } else {
        // 📴 OFFLINE: use snapshot (or fallback queue)
        const snap = window.electron?.getLikedList?.() ?? [];
        if (snap.length) {
          console.log("📦 Offline liked (snapshot):", snap.length);
          rows = snap;
        } else if (window.electron?.getLikedQueue) {
          const q = window.electron.getLikedQueue() || [];
          console.log("📦 Offline liked (queue fallback):", q.length);
          rows = q;
        } else {
          console.warn("⚠️ Offline and no preload getters available");
        }
      }
  
      // ✅ de-dupe by id
      const seen = new Set();
      const unique = [];
      for (const m of rows) {
        const id = getId(m);
        if (id && !seen.has(id)) { seen.add(id); unique.push(m); }
      }
      console.log("🧮 Final liked list set:", unique.length, "| online:", isOnline);
      setLikedMovies(unique);
  
    } catch (err) {
      console.error("❌ Failed to fetch liked movies:", err);
    } finally {
      const elapsed = Date.now() - start;
      setTimeout(() => setIsLoading(false), Math.max(0, minDelay - elapsed));
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

  // Replays queued offline "like" actions when back online
  // const syncQueuedLikes = async () => {
  //   try {
  //     const raw = window.electron?.getRawLikedQueue?.() || [];
  //     if (!raw.length) return;

  //     for (const entry of raw) {
  //       const m = entry?.movie || entry;
  //       const id = String(m?.movieId ?? m?._id ?? "");
  //       if (!id) continue;

  //       if (entry?.type === "add") {
  //         try {
  //           // Match your working online body: movieId receives the full object
  //           await fetch(`${API}/api/movies/like`, {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({ userId: savedUser.userId, movieId: m }),
  //           });
  //           // remove this movie from the queue file
  //           window.electron?.removeFromLikedQueue?.(id);
  //         } catch (e) {
  //           console.warn("❌ Sync add failed for", id, e);
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error("❌ syncQueuedLikes error:", err);
  //   }
  // };

  // Replays queued offline "like" actions when back online
  const syncQueuedLikes = async () => {
    try {
      const raw = window.electron?.getRawLikedQueue?.() || [];
      if (!raw.length) return;

      // Start from what's currently on screen
      const ui = [...likedMovies];
      const seen = new Set(ui.map(getId));

      for (const entry of raw) {
        const m = entry?.movie || entry;
        const id = String(m?.movieId ?? m?._id ?? "");
        if (!id) continue;

        if (entry?.type === "add") {
          try {
            // Match your working online body: movieId receives the full object
            await fetch(`${API}/api/movies/like`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: savedUser.userId, movieId: m }),
            });

            // ✅ Optimistically keep it visible in UI/local file
            if (!seen.has(id)) {
              ui.unshift(m);
              seen.add(id);
            }

            // Clean the queue entry we just synced
            window.electron?.removeFromLikedQueue?.(id);
          } catch (e) {
            console.warn("❌ Sync add failed for", id, e);
          }
        } else if (entry?.type === "delete") {
          try {
            await fetch(`${API}/api/movies/likedMovies/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: savedUser.userId, movieId: id }),
            });

            // ✅ Optimistically remove from UI/local file
            const idx = ui.findIndex((mm) => getId(mm) === id);
            if (idx !== -1) ui.splice(idx, 1);

            window.electron?.removeFromLikedQueue?.(id);
          } catch (e) {
            console.warn("❌ Sync delete failed for", id, e);
          }
        }
      }

      // ✅ Persist optimistic state so it doesn't "disappear" before server refresh
      setLikedMovies(ui);
      window.electron?.saveLikedList?.(ui); // <— snapshot is the UI truth
    } catch (err) {
      console.error("❌ syncQueuedLikes error:", err);
    }
  };


  useEffect(() => {
    const run = async () => {
      if (!savedUser?.userId) return;
  
      if (isOnline) {
        // 1) Apply any offline queued actions (no-op if none)
        await syncQueuedLikes();
  
        // 2) Load latest from DB and overwrite state + snapshot
        await fetchLikedMovies(savedUser.userId);
      } else {
        // Offline: show snapshot/queue via fetchLikedMovies' offline path
        await fetchLikedMovies(savedUser.userId);
      }
    };
  
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, savedUser?.userId]);
  
  const handleRemove = async (id) => {
    if (!id || !savedUser?.userId) return;
  
    // 1) Optimistic UI + write-through snapshot (so "back" doesn't flash old UI)
    setLikedMovies((prev) => {
      const next = prev.filter((m) => getId(m) !== id);
      try { window.electron?.saveLikedList?.(next); } catch {}
      if (!isOnline) {
        // offline: queue delete for later sync
        try { window.electron?.queueLiked?.({ type: "delete", movieId: id }); } catch {}
      }
      return next;
    });
  
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  
    // 2) If offline we're done
    if (!isOnline) return;
  
    // 3) Online: delete on backend
    try {
      const res = await fetch(`${API}/api/movies/likedMovies/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId: id }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText}`);
      }
  
      // 4) After success, write the snapshot again using the latest state
      //    (avoid using an old closure of likedMovies)
      const next = (typeof window !== "undefined" ? window.electron?.getLikedList?.() : [])?.filter?.(
        (m) => getId(m) !== id
      ) || [];
      try { window.electron?.saveLikedList?.(next); } catch {}
  
      // (Optional) refresh from server:
      // await fetchLikedMovies(savedUser.userId);
  
    } catch (err) {
      console.error("❌ Error removing liked movie:", err);
      // (Optional) rollback:
      // await fetchLikedMovies(savedUser.userId);
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
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
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
