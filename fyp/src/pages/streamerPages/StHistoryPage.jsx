import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import { API } from "@/config/api";


const StHistoryPage = () => {
  const [historyMovies, setHistoryMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const fetchHistoryMovies = async (userId) => {
    if (!userId) return;
    setIsLoading(true);

    const start = Date.now(); // Track start time


    try {
      const res = await fetch(`${API}/api/movies/historyMovies/${userId}`);
      const data = await res.json();

      console.log("📽 History movies response:", data);

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
    }  finally {
      const elapsed = Date.now() - start;
      const minDelay = 500; // milliseconds
  
      setTimeout(() => {
        setIsLoading(false);
      }, Math.max(0, minDelay - elapsed)); // ensure at least 500ms visible
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchHistoryMovies(savedUser.userId);
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

  const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) {
      console.warn("Missing movieId or userId");
      return;
    }
  
    try {
      const res = await fetch(`${API}/api/movies/historyMovies/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId: movieId,
        }),
      });
  

      const data = await res.json();
      console.log("🗑️ Remove response:", data);

      console.log("Before removal:", historyMovies.map(m => typeof m.movieId), typeof movieId);

  
      // ✅ Remove movie from frontend UI state
      setHistoryMovies((prev) =>
        prev.filter((m) => m.movieId.toString() !== movieId.toString())
      );

      
      setShowSuccess(true); // ✅ show popup
      setTimeout(() => setShowSuccess(false), 2000); // auto-hide
    } catch (err) {
      console.error("❌ Error removing liked movie:", err);
    }
  };

  // const handleRemoveAllHistory = async () => {
  //   const savedUser = JSON.parse(localStorage.getItem("user"));
  //   if (!savedUser?.userId) return;
  
  //   try {

  //     const res = await fetch(`${API}/api/movies/historyMovies/removeAllHistory`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ userId: savedUser.userId }),
  //     });
  
  //     const result = await res.json();
  //     console.log("🧹 Clear history response:", result);
  
  //     // Clear the local state
  //     setHistoryMovies([]);
  //   } catch (err) {
  //     console.error("❌ Error clearing history:", err);
  //   }
  // };
  

  const handleRemoveAllHistory = async () => {
    console.log("🧹 handleRemoveAllHistory called");
  
    const savedUser = JSON.parse(localStorage.getItem("user"));
    console.log("🔍 savedUser:", savedUser);
  
    if (!savedUser?.userId) {
      console.warn("⚠️ No userId found");
      return;
    }
  
    try {
      const res = await fetch(`${API}/api/movies/historyMovies/removeAllHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: savedUser.userId }),
      });
  
      console.log("✅ HTTP status:", res.status);
  
      const result = await res.json();
      console.log("📦 Backend response:", result);
  
      setHistoryMovies([]);  // Clear state
    } catch (err) {
      console.error("❌ Error clearing history:", err);
    }
  };
  


  return (
    <div className="p-4">
      <StNav />

      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {historyMovies.map((movie) => (
                <div
                  key={movie._id || movie.movieId}
                  className="bg-white rounded-lg shadow p-2"
                >
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="rounded mb-2 w-full h-60 object-cover"
                  />
                  <h3 className="text-sm font-semibold">{movie.title}</h3>

                  <div className="flex justify-center gap-2 mt-2">
                    {/* play btn */}
                    <button
                      onClick={() => {
                        console.log("▶️ Play clicked for:", movie.movieId);
                        handlePlay(movie.movieId, movie.trailer_url); // ✅ Pass trailerUrl here
                      }}
                      className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                    >
                      <Play className="w-3 h-3 mr-1 fill-black" />
                      Play
                    </button>

                    {/* remove btn */}
                    <button
                      onClick={() => handleRemove(movie.movieId)}
                      className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200 mt-1"
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