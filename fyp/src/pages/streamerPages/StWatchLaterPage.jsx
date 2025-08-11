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

  // ✅ Fetch saved movies (watch later)
  const fetchWatchLaterMovies = async (userId) => {
    if (!userId) return;
  
    setIsLoading(true);
    const start = Date.now();
    const minDelay = 500;
  
    try {
      let savedList = [];
      let ids = [];                 // for debug
      let pool = [];                // for debug
      let fetchedDetails = [];      // for debug
  
      if (isOnline) {
        // 1) fetch from API
        const res = await fetch(`${API}/api/movies/watchLater/${userId}`);
        const data = await res.json();
        console.log("🌐 Online response from API:", data);
  
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
          ids = raw
            .map((x) =>
              typeof x === "string" || typeof x === "number"
                ? String(x)
                : String(x?.movieId ?? x?._id ?? x?.tmdb_id ?? "")
            )
            .filter(Boolean);
  
          try {
            pool = (await window.electron?.getRecommendedMovies?.()) || [];
          } catch {}
  
          savedList = ids.map((id) => {
            const found = pool.find((m) => String(m.movieId) === String(id));
            return found || { movieId: String(id), title: `Movie #${id}`, poster_url: "" };
          });
  
          // (Optional) fill missing placeholders with detail fetches
          const isPlaceholder = (m) =>
            !m?.title || /^Movie #/.test(m.title) || !m?.poster_url;
  
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
                const batch = await batchRes.json();
                fetchedDetails = (batch || []).map(normalizeMovie).filter(Boolean);
              } else {
                fetchedDetails = (
                  await Promise.all(
                    missingIds.map(async (id) => {
                      try {
                        const r = await fetch(`${API}/api/movies/details/${id}`);
                        if (!r.ok) throw 0;
                        const d = await r.json();
                        return normalizeMovie(d);
                      } catch {
                        return null;
                      }
                    })
                  )
                ).filter(Boolean);
              }
  
              if (fetchedDetails.length) {
                const byId = new Map(savedList.map((m) => [String(m.movieId), m]));
                for (const m of fetchedDetails) {
                  const key = String(m?.movieId ?? m?._id);
                  if (key) byId.set(key, m);
                }
                savedList = Array.from(byId.values());
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
        console.log("📦 Offline Watch Later snapshot:", offlineObjects);
        savedList = offlineObjects || [];
      } else {
        console.warn("⚠️ Offline and no preload getSavedSnapshot available");
      }
  
      // 4) dedupe
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
        }
      }
  
      // 5) safe debug (works online/offline)
      const isPlaceholderDbg = (m) => !m?.title || /^Movie #/.test(m.title) || !m?.poster_url;
      const placeholders = savedList.filter(isPlaceholderDbg);
  
      console.group("🧩 Watch Later debug");
      if (ids.length) console.log("IDs from API →", ids);
      if (pool.length) console.log("Found in local pool →", pool.length);
      if (ids.length) {
        console.log(
          "Missing IDs (no pool match) →",
          ids.filter((id) => !savedList.find((m) => String(m.movieId) === String(id) && !isPlaceholderDbg(m)))
        );
      }
      if (typeof fetchedDetails.length === "number") {
        console.log("Fetched details count →", fetchedDetails.length);
      }
      console.log("Snapshot will save →", savedList.map((m) => m.movieId));
      console.log("Counts →", {
        totalInSavedList: savedList.length,
        placeholdersInSavedList: placeholders.length,
        uniqueAfterDedupe: uniqueMovies.length,
      });
      console.groupEnd();
  
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
          } else if (action.type === "add") {
            // Support both shapes: { movieId } or { movie: { movieId } }
            const id =
              action.movieId || action.movie?.movieId || action.movie?._id;

            if (!id) {
              console.warn("⚠️ Skipping add: no movieId in action", action);
            } else {
              await fetch(`${API}/api/movies/watchLater`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: savedUser.userId,
                  movieId: String(id),
                }),
              });
            }
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
      prev.filter((m) => String(m.movieId) !== String(movieId))
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

      if (!res.ok) throw new Error("❌ Server error");

      // 🆕 prune snapshot so offline view updates instantly
      try {
        const snap = window.electron?.getSavedSnapshot?.() || [];
        const updated = snap.filter(
          (m) => String(m?.movieId ?? m?._id) !== String(movieId)
        );
        window.electron?.saveSavedSnapshot?.(updated);
      } catch {}
    } catch (err) {
      console.error("❌ Failed to remove saved movie:", err);
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