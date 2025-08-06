import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import { API } from "@/config/api";

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
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
      window.electron?.saveSubscription(subscription);
    } else {
      const offlineSub = window.electron?.getSubscription();
      subscription = offlineSub?.userId === userId ? offlineSub : null;
      console.log("📦 Offline subscription data:", subscription);
    }

    console.log("🧪 Subscription before setting:", subscription);
    setIsSubscribed(subscription?.isActive === true); // force exact boolean match
  } catch (err) {
    console.error("Failed to fetch subscription:", err);
    setIsSubscribed(false); // fallback
  }
};

useEffect(() => {
  console.log("🎯 Updated isSubscribed:", isSubscribed);
}, [isSubscribed]);


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
      // ✅ Offline: load from local file
      const offlineQueue = await window.electron.getLikedQueue();
      data.likedMovies = offlineQueue || [];
      console.log("📦 Liked movies (offline):", data.likedMovies);
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
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchLikedMovies(savedUser.userId);
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
        newTab.location.href = trailerUrl; // ✅ now load trailer
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close(); // if error, close tab
    }
  };

  useEffect(() => {
  const syncLikedQueue = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser?.userId) return;

    const liked = window.electron.getRawLikedQueue?.() || [];

    for (const action of liked) {
      try {
        if (action.type === "delete") {
          await fetch(`${API}/api/movies/like/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              movieId: action.movieId,
            }),
          });
        } else if (action.movie) {
          await fetch(`${API}/api/movies/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              movie: action.movie,
            }),
          });
        }
      } catch (err) {
        console.warn("❌ Failed to sync liked movie:", err);
      }
    }

    window.electron.clearLikedQueue?.();
    console.log("✅ Synced liked queue");
  };

  if (isOnline) syncLikedQueue();
}, [isOnline]);

  const handleRemove = async (movieId) => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (!movieId || !savedUser?.userId) {
    console.warn("⚠️ Missing movieId or userId");
    return;
  }

  // ✅ Always remove from UI first
  setLikedMovies((prev) =>
    prev.filter((m) => m.movieId?.toString() !== movieId.toString())
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