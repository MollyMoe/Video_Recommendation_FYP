import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

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

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
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
