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

  // const fetchLikedMovies = async (userId) => {
  //   if (!userId) {
  //     console.warn("❗ No userId provided");
  //     return;
  //   }

  //   setIsLoading(true);
  //   const start = Date.now();
  //   const minDelay = 500;

  //   try {
  //     let data = { likedMovies: [] };

  //     if (isOnline) {
  //       const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
  //       data = await res.json();
  //       console.log("🎬 Liked movies (online):", data);

  //       // 1) server list
  //       const server = Array.isArray(data?.likedMovies) ? data.likedMovies : [];

  //       // 2) local snapshot (old likes + any offline-added)
  //       const snap = window.electron?.getLikedList?.() ?? [];

  //       // 3) any queued ADD actions not yet synced
  //       const queuedAddMovies = (window.electron?.getRawLikedQueue?.() ?? [])
  //         .filter(e => e?.type === "add")
  //         .map(e => e?.movie || e);

  //       // merge & dedupe by id
  //       const idOf = (m) => (m?._id ?? m?.movieId ?? "").toString();
  //       const seen = new Set();
  //       const merged = [...server, ...snap, ...queuedAddMovies].filter(m => {
  //         const id = idOf(m);
  //         if (!id || seen.has(id)) return false;
  //         seen.add(id);
  //         return true;
  //       });

  //       // set UI and persist snapshot (NOT the queue)
  //       data.likedMovies = merged;
  //       window.electron?.saveLikedList?.(merged);
  //     }

  //     // if (isOnline) {
  //     //   // ✅ Online: fetch from FastAPI
  //     //   const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
  //     //   data = await res.json();
  //     //   console.log("🎬 Liked movies (online):", data);

  //     //   // ✅ Save for offline access
  //     //   if (window.electron?.saveLikedQueue) {
  //     //     window.electron.saveLikedQueue(data.likedMovies);
  //     //   }
  //     // } else if (window.electron?.getLikedQueue) {
  //     //   // ✅ Offline: use normalized liked queue (movies array)
  //     //   const offlineMovies = window.electron.getLikedQueue();
  //     //   console.log("📦 Offline liked movies (normalized):", offlineMovies);
  //     //   data.likedMovies = offlineMovies || [];

  //     //   // (Optional debug) If nothing found, peek at raw shape:
  //     //   if (!data.likedMovies?.length && window.electron?.getRawLikedQueue) {
  //     //     const rawQueue = window.electron.getRawLikedQueue();
  //     //     console.log("🧪 Raw liked queue (fallback view):", rawQueue);
  //     //   }
  //     // } else {

  //    else if (window.electron?.getLikedList) {
  //     // ✅ Offline: use snapshot (cineit-liked.json) for instant UI
  //     const offlineMovies = window.electron.getLikedList() ?? [];
  //     console.log("📦 Offline liked movies (snapshot):", offlineMovies);
  //     data.likedMovies = offlineMovies;

  //   } else if (window.electron?.getLikedQueue) {
  //     // Fallback: old queue reader (still works if snapshot isn’t available)
  //     const offlineMovies = window.electron.getLikedQueue() || [];
  //     console.log("📦 Offline liked movies (queue fallback):", offlineMovies);
  //     data.likedMovies = offlineMovies;

  //   } else {

  //       console.warn("⚠️ Offline and no preload getLikedQueue available");
  //     }

  //     // ✅ Deduplicate
  //     const seen = new Set();
  //     const uniqueMovies = [];
  //     for (const movie of data.likedMovies || []) {
  //       const id = getId(movie);
  //       if (id && !seen.has(id)) {
  //         seen.add(id);
  //         uniqueMovies.push(movie);
  //       }
  //     }
  //     setLikedMovies(uniqueMovies);

  //   } catch (err) {
  //     console.error("❌ Failed to fetch liked movies:", err);
  //   } finally {
  //     const elapsed = Date.now() - start;
  //     setTimeout(() => {
  //       setIsLoading(false);
  //     }, Math.max(0, minDelay - elapsed));
  //   }
  // };

  // const fetchLikedMovies = async (userId) => {
  //   if (!userId) {
  //     console.warn("❗ No userId provided");
  //     return;
  //   }

  //   setIsLoading(true);
  //   const start = Date.now();
  //   const minDelay = 500;

  //   try {
  //     let data = { likedMovies: [] };

  //     if (isOnline) {
  //       const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
  //       data = await res.json();
  //       console.log("🎬 Liked movies (online):", data);

  //       // 1) server list
  //       const server = Array.isArray(data?.likedMovies) ? data.likedMovies : [];

  //       // 2) local snapshot (old likes + any offline-added)
  //       const snap = window.electron?.getLikedList?.() ?? [];

  //       // 3) any queued ADD actions not yet synced
  //       const queuedAddMovies = (window.electron?.getRawLikedQueue?.() ?? [])
  //         .filter((e) => e?.type === "add")
  //         .map((e) => e?.movie || e);

  //       // merge & dedupe by id
  //       const idOf = (m) => (m?._id ?? m?.movieId ?? "").toString();
  //       const seen = new Set();
  //       const merged = [...server, ...snap, ...queuedAddMovies].filter((m) => {
  //         const id = idOf(m);
  //         if (!id || seen.has(id)) return false;
  //         seen.add(id);
  //         return true;
  //       });

  //       // set UI and persist snapshot (NOT the queue)
  //       data.likedMovies = merged;
  //       window.electron?.saveLikedList?.(merged);
  //     } else if (window.electron?.getLikedList) {
  //       // ✅ Offline: use snapshot (cineit-liked.json) for instant UI
  //       const offlineMovies = window.electron.getLikedList() ?? [];
  //       console.log("📦 Offline liked movies (snapshot):", offlineMovies);
  //       data.likedMovies = offlineMovies;
  //     } else if (window.electron?.getLikedQueue) {
  //       // Fallback: old queue reader (still works if snapshot isn’t available)
  //       const offlineMovies = window.electron.getLikedQueue() || [];
  //       console.log("📦 Offline liked movies (queue fallback):", offlineMovies);
  //       data.likedMovies = offlineMovies;
  //     } else {
  //       console.warn(
  //         "⚠️ Offline and no preload getLikedList/getLikedQueue available"
  //       );
  //     }

  //     // ✅ Deduplicate (keep your existing dedupe)
  //     const dedupeSet = new Set();
  //     const uniqueMovies = [];
  //     for (const movie of data.likedMovies || []) {
  //       const id = getId(movie);
  //       if (id && !dedupeSet.has(id)) {
  //         dedupeSet.add(id);
  //         uniqueMovies.push(movie);
  //       }
  //     }
  //     setLikedMovies(uniqueMovies);
  //   } catch (err) {
  //     console.error("❌ Failed to fetch liked movies:", err);
  //   } finally {
  //     const elapsed = Date.now() - start;
  //     setTimeout(() => {
  //       setIsLoading(false);
  //     }, Math.max(0, minDelay - elapsed));
  //   }
  // };

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

  // useEffect(() => {
  //   const syncLikedDiff = async () => {
  //     if (!isOnline || !savedUser?.userId) return;

  //     await syncQueuedLikes();

  //     // Choose the endpoint your backend supports:
  //     const DELETE_URL = `${API}/api/movies/likedMovies/delete`;
  //     // If your server only has /api/movies/like/delete, use that instead:
  //     // const DELETE_URL = `${API}/api/movies/like/delete`;

  //     try {
  //       // 1) Server liked list
  //       const res = await fetch(
  //         `${API}/api/movies/likedMovies/${savedUser.userId}`
  //       );
  //       if (!res.ok)
  //         throw new Error(`Server liked fetch failed: ${res.status}`);
  //       const payload = await res.json();
  //       const serverLiked = Array.isArray(payload?.likedMovies)
  //         ? payload.likedMovies
  //         : [];

  //       // 2) Local liked list (offline truth)
  //       // 2) Local liked list (offline truth = snapshot)
  //       const localLiked = window.electron?.getLikedList?.() || [];

  //       // 3) Diff by normalized id
  //       const serverSet = new Set(serverLiked.map(getId));
  //       const localSet = new Set(localLiked.map(getId));
  //       const toDelete = [...serverSet].filter((id) => !localSet.has(id));

  //       // 4) Send deletes for items removed offline
  //       for (const movieId of toDelete) {
  //         try {
  //           const delRes = await fetch(DELETE_URL, {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({
  //               userId: savedUser.userId,
  //               movieId,
  //             }),
  //           });
  //           if (!delRes.ok) {
  //             const t = await delRes.text();
  //             console.warn("❌ Delete failed for", movieId, delRes.status, t);
  //           }
  //         } catch (e) {
  //           console.warn("❌ Delete error for", movieId, e);
  //         }
  //       }

  //       // 5) Refresh UI/cache to match server
  //       await fetchLikedMovies(savedUser.userId);
  //     } catch (e) {
  //       console.error("❌ Liked diff sync failed:", e);
  //     }
  //   };

  //   syncLikedDiff();
  // }, [isOnline]);

  // const handleRemove = async (id) => {
  //   if (!id || !savedUser?.userId) return;

  //   // ✅ Optimistic UI + write-through to disk when offline
  //   setLikedMovies((prev) => {
  //     const next = prev.filter((m) => getId(m) !== id);
    
  //     // Always keep the local snapshot in sync so navigating back doesn’t flash old UI
  //     try { window.electron?.saveLikedList?.(next); } catch {}
    
  //     // If offline, queue the deletion for later sync
  //     if (!isOnline) {
  //       window.electron?.queueLiked?.({ type: "delete", movieId: id });
  //     }
    
  //     return next;
  //   });
    

  //   setShowSuccess(true);
  //   setTimeout(() => setShowSuccess(false), 2000);

  //   // ✅ OFFLINE: we're done (already persisted locally)
  //   if (!isOnline) return;

  //   // ✅ ONLINE: delete on backend
  //   try {
  //     const res = await fetch(`${API}/api/movies/likedMovies/delete`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userId: savedUser.userId,
  //         movieId: id,
  //       }),
  //     });

  //     if (!res.ok) {
  //       const errText = await res.text();
  //       throw new Error(`Server error ${res.status}: ${errText}`);
  //     }

  //     // ✅ Keep local snapshot in sync after successful online delete
  //     window.electron?.saveLikedQueue?.(
  //       likedMovies.filter((m) => getId(m) !== id)
  //     );

  //     // (Optional) await fetchLikedMovies(savedUser.userId);
  //   } catch (err) {
  //     console.error("❌ Error removing liked movie:", err);
  //     // (Optional) rollback: await fetchLikedMovies(savedUser.userId);
  //   }
  // };


    // When coming back online, sync queued history actions with server
useEffect(() => {
  if (isOnline) {
    (async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser?.userId) return;

        console.log("🌐 Back online — syncing offline history queue...");
        await window.electron?.syncQueuedHistory?.(API, savedUser.userId);

        // After syncing, fetch from server and update local snapshot
         await fetchLikedMovies(savedUser.userId);
      } catch (err) {
        console.error("❌ Failed to sync queued history:", err);
      }
    })();
  }
}, [isOnline]);

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