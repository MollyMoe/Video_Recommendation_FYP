import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;


const StHistoryPage = () => {
  const [historyMovies, setHistoryMovies] = useState([]);

  const fetchHistoryMovies = async (userId) => {
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
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />

      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">


        <div className="-mt-4 flex justify-end mb-5">
          <button
            onClick={handleRemoveAllHistory}
            className="bg-white text-black font-medium border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm shadow-md"
          >
            Remove all History
          </button>
        </div>
          {historyMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">No history movies found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {historyMovies.map((movie) => (
                <div key={movie._id || movie.movieId} className="bg-white rounded-lg shadow p-2">
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
    </div>
  );
};

export default StHistoryPage;
