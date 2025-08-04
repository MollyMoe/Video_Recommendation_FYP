import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const TopLiked = () => {
  const [topMovies, setTopMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopLiked = async () => {
      try {
        const res = await axios.get(`${API}/api/movies/top-liked`);
        console.log("📦 Top liked movies response:", res.data);
        setTopMovies(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch top liked movies", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopLiked();
  }, []);

  if (isLoading) {
    return <div className="text-center text-white">Loading top liked movies...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        🎬 Top Liked Movies
      </h1>

      <div className="space-y-5">
        {topMovies.map(({ movieId, likeCount, details }, index) => (
          <div
            key={movieId}
            className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="text-2xl font-bold w-10 text-center text-purple-600 dark:text-yellow-400">
              {index + 1}
            </div>

            <img
              src={details?.poster_url || "https://via.placeholder.com/80x120?text=No+Image"}
              alt={details?.title || "Movie Poster"}
              className="w-24 h-36 object-cover rounded-md"
            />

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {details?.title || "Unknown Title"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Movie ID: {movieId}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-pink-600 dark:text-pink-400 mr-10">
                ❤️ {likeCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mr-10">Likes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopLiked;
