<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
=======
import { useEffect, useState } from "react";
>>>>>>> c87e97ec1acdecc208442b1bd6addc859ca2c284

const API = import.meta.env.VITE_API_BASE_URL;

const StWatchLaterPage = () => {
<<<<<<< HEAD
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);

  const fetchWatchLaterMovies = async (userId) => {
    try {
      const res = await fetch(`${API}/api/movies/watchLater/${userId}`);
      const data = await res.json();

      console.log("🎬 Watch Later response:", data);

      // Remove duplicates by _id or movieId
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of data.SaveMovies || []) {
        const id = movie._id || movie.movieId;
        if (!seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        }
      }

      setWatchLaterMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch watch later movies:", err);
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchWatchLaterMovies(savedUser.userId);
    }
=======
  const [movies, setMovies] = useState([]);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/movies/saved/${savedUser.userId}`);
        const data = await res.json();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
>>>>>>> c87e97ec1acdecc208442b1bd6addc859ca2c284
  }, []);

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
<<<<<<< HEAD
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {watchLaterMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">No saved movies found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {watchLaterMovies.map((movie) => (
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
=======
      <h2 className="text-xl font-bold mb-4">History</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map((movie) => (
          <div key={movie._id} className="bg-white rounded-lg shadow p-2">
            <img src={movie.posterUrl} alt={movie.title} className="rounded mb-2" />
            <h3 className="text-sm font-semibold">{movie.title}</h3>
          </div>
        ))}
>>>>>>> c87e97ec1acdecc208442b1bd6addc859ca2c284
      </div>
    </div>
  );
};

export default StWatchLaterPage;
