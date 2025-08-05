import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";

import {Play, Trash2, CheckCircle} from "lucide-react";
import { API } from "@/config/api";

const StWatchLaterPage = () => {
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

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

      // Save for offline use (entire object)
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

  const fetchWatchLaterMovies = async (userId) => {
  if (!userId) return;
  setIsLoading(true);
  const start = Date.now();
  const minDelay = 500;

  try {
    let data = { SaveMovies: [] };

    if (isOnline) {
      // ✅ Online: fetch from backend
      const res = await fetch(`${API}/api/movies/watchLater/${userId}`);
      data = await res.json();

      // ✅ Save for offline viewing
      if (window.electron?.saveSavedQueue) {
        window.electron.saveSavedQueue(data.SaveMovies);
      }
    } else if (window.electron?.getSavedQueue) {
      // ✅ Offline: load from local file
      const offlineQueue = await window.electron.getSavedQueue();
      data.SaveMovies = offlineQueue || [];
    } else {
      console.warn("⚠️ Offline and no preload getSavedQueue available");
    }
    console.log("📽 Saved movies response:", data);

    // ✅ Deduplicate
    const uniqueMovies = [];
    const seen = new Set();
    
    for (const movie of data.SaveMovies || []) {
      const id = movie._id || movie.movieId;
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
    setTimeout(() => {
      setIsLoading(false);
    }, Math.max(0, minDelay - elapsed));
  }
};

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchWatchLaterMovies(savedUser.userId);
      fetchSubscription(savedUser.userId);
      fetchSubscription(savedUser.userId);
    }
  }, []);


  const handlePlay = async (movieId, trailerUrl) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
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
        newTab.location.href = trailerUrl;  // ✅ now load trailer
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close(); // if error, close tab
    }
  };

  useEffect(() => {
  const syncSavedQueue = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser?.userId) return;

    const saved = window.electron.getRawSavedQueue?.() || [];

    for (const action of saved) {
      try {
        if (action.type === "delete") {
          await fetch(`${API}/api/movies/save/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              movieId: action.movieId,
            }),
          });
        } else if (action.movie) {
          await fetch(`${API}/api/movies/save`, {
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



  const handleRemove = async (movieId) => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!movieId || !savedUser?.userId) {
    console.warn("⚠️ Missing movieId or userId");
    return;
  }

  // ✅ Remove from UI
  setWatchLaterMovies((prev) =>
    prev.filter((m) => m.movieId?.toString() !== movieId.toString())
  );
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 2000);

  if (!isOnline) {
    console.log("📦 Offline — removing from saved queue");
    window.electron?.removeFromSavedQueue?.(movieId);
    return;
  }

  // ✅ Online API removal
  try {
    const res = await fetch(`${API}/api/movies/watchLater/delete`, {
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
    console.log("🗑️ Removed from Watch Later (online):", data);
  } catch (err) {
    console.error("❌ Failed to remove from watch later:", err.message || err);
    alert("Could not remove movie. Try again later.");
  }
};

  
  return (
    <div className="p-4">
      <StNav />

      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {watchLaterMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No saved movies found.
            </p>
            <p className="text-center mt-10 text-white">
              No saved movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {watchLaterMovies.map((movie) => (
                <div
                  key={movie._id || movie.movieId}
                  className="bg-white rounded-lg shadow p-2 flex flex-col justify-between h-[320px]"
                >
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="rounded mb-2 w-full h-60 object-cover"
                  />
                  <h3 className="text-sm font-semibold mb-2 line-clamp-2">{movie.title}</h3>

                  <div className="flex justify-center gap-2 mt-auto">
                    {/* play btn */}
                    <button
                      onClick={() => {
                        console.log("▶️ Play clicked for:", movie.movieId);
                        handlePlay(movie.movieId, movie.trailer_url); // ✅ Pass trailerUrl here
                      }}
                     disabled={!isSubscribed}
                      className={`flex items-center justify-center flex-1 text-xs px-2 py-1 rounded-lg shadow-sm
                      ${isSubscribed
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                      <Play className="w-3 h-3 mr-1 fill-black" />
                      Play
                    </button>

                    {/* remove btn */}
                    <button
                      onClick={() => handleRemove(movie.movieId)}
                      disabled={!isSubscribed}
                      className={`flex items-center justify-center flex-1 text-xs px-2 py-1 rounded-lg shadow-sm
                      ${isSubscribed
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                      <Trash2 className="w-3 h-3 mr-1 fill-black" />
                      Remove
                    </button>
                  </div>
                </div>
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
            <span className="font-medium">Movie removed from Watch Later list!</span>
          </div>
        </div>
      )}

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
            <span className="font-medium">Movie removed from Watch Later list!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StWatchLaterPage;