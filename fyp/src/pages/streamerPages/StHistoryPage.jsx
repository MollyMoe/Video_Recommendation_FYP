
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import CompactMovieCard from "../../components/movie_components/CompactMovieCard";
import axios from "axios";
import { API } from "@/config/api";



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

  const fetchHistoryMovies = async (userId) => {
  if (!userId) return;
  setIsLoading(true);
  const start = Date.now();
  const minDelay = 500;

  try {
    let data = { historyMovies: [] };

    if (isOnline) {
      // ✅ Online: Fetch from FastAPI
      const res = await fetch(`${API}/api/movies/historyMovies/${userId}`);
      data = await res.json();

      // ✅ Optional: Save to local history queue for offline use
      if (isOnline && window.electron?.saveHistoryQueue) {
      window.electron.saveHistoryQueue(data.historyMovies);
    }

    } else if (window.electron?.getHistoryQueue) {
      // ✅ Offline: Read from local queue
      const offlineQueue = await window.electron.getHistoryQueue();
      data.historyMovies = offlineQueue || [];
    } else {
      console.warn("⚠️ Offline and no preload method found.");
    }

    console.log("📽 History movies response:", data);

    // ✅ Deduplicate
    const uniqueMovies = [];
    const seen = new Set();

    for (const movie of data.historyMovies || []) {
      const id = movie._id || movie.movieId;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueMovies.push(movie);
      }
    }

    setHistoryMovies(uniqueMovies);
  } catch (err) {
    console.error("❌ Failed to fetch history movies:", err);
  } finally {
    const elapsed = Date.now() - start;
    setTimeout(() => {
      setIsLoading(false);
    }, Math.max(0, minDelay - elapsed));
  }
};

// ✅ Call it on mount
  useEffect(() => {
    if (savedUser?.userId) {
      fetchHistoryMovies(savedUser.userId);
      fetchSubscription(savedUser.userId);
    }
  }, []);

  // When user goes back online
  useEffect(() => {
    if (isOnline && savedUser?.userId) {
      console.log("🔁 Re-fetching history from server after coming online...");
      fetchHistoryMovies(savedUser.userId);
    }
  }, [isOnline]);
  

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

 const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) {
      console.warn("⚠️ Missing movieId or userId");
      return;
    }
  
    // ✅ Remove from UI
    setHistoryMovies((prev) =>
      prev.filter((m) => m.movieId?.toString() !== movieId.toString())
    );
    window.electron?.removeMovieFromHistoryCache?.(movieId); // ✅ REMOVE from cache
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  
    if (!isOnline) {
      console.log(`📴 OFFLINE DELETE — MovieID: ${movieId}`);
  
      window.electron?.removeFromHistoryQueue?.(movieId);
      console.log("🗑️ Removed from local history queue");
  
      window.electron?.queueHistoryAction?.({
        type: "delete",
        movieId,
      });
      console.log("📦 Queued delete action for later sync");
  
      return;
    }
  
    // ✅ Online API removal
    try {
      const res = await fetch(`${API}/api/movies/historyMovies/delete`, {
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
      console.log("🗑️ Removed from history (online):", data);
    } catch (err) {
      console.error("❌ Failed to remove from history:", err.message || err);
      alert("Could not remove movie from history.");
    }
  };


const handleRemoveAllHistory = async () => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser?.userId) return;

  setHistoryMovies([]); // Clear UI immediately

  if (isOnline) {
    try {
      await fetch(`${API}/api/movies/historyMovies/removeAllHistory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId }),
      });
      console.log("🧹 Server history cleared.");
    } catch (err) {
      console.error("❌ Server clear error:", err);
    }
  } else {
    window.electron?.clearHistoryQueueByUser?.(savedUser.userId);
  }
};


useEffect(() => {
  const syncHistoryQueue = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser?.userId) return;

    const history = window.electron.getRawHistoryQueue?.() || [];

    for (const action of history) {
      try {
        if (action.type === "delete") {
          await fetch(`${API}/api/movies/history/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              movieId: action.movieId,
            }),
          });
        } else if (action.movie) {
          await fetch(`${API}/api/movies/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              movie: action.movie,
            }),
          });
        }
      } catch (err) {
        console.warn("❌ Failed to sync history movie:", err);
      }
    }

    window.electron.clearHistoryQueue?.();
    console.log("✅ Synced history queue");
  };

  if (isOnline) syncHistoryQueue();
}, [isOnline]);


return (
    <div className="p-4">
      <StNav />

      <StSideBar />

      <div className="sm:ml-64 pt-20 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="-mt-4 flex justify-end mb-5">
            {/* play all history btn */}
            {/* <button
              onClick={handleRemoveAllHistory}
              className="bg-white text-black font-medium border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm shadow-md"
            >
              Remove all History
            </button> */}

            <button
              onClick={() => setShowConfirm(true)}
              className="bg-white text-black font-medium border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm shadow-md"
            >
              Remove all History
            </button>
          </div>
          {historyMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No history movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {historyMovies.map((movie) => (
                
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
            <p className="text-lg font-semibold">Loading Movie History</p>

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
            <span className="font-medium">Movie removed from history!</span>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 text-center">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Message */}
            <p className="mb-6 text-gray-700">
              Are you sure you want to remove all history?
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  handleRemoveAllHistory();
                  setShowConfirm(false);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StHistoryPage;