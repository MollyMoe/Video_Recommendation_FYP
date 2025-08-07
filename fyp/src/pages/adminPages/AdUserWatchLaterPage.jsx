import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trash2, CheckCircle } from "lucide-react";

import { getAPI } from "@/config/api";

const AdUserWatchLaterPage = () => {
  const { id: userId } = useParams();
  const [user, setUser] = useState(null);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`${API}/api/auth/users/streamer/${userId}`);
      if (!res.ok) throw new Error("User details not found");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
  };

  const fetchWatchLaterMovies = async (userIdToFetch) => {
    if (!userIdToFetch) {
      setIsLoading(false);
      setError("No user ID found to fetch watch later movies.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/movies/watchLater/${userIdToFetch}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || res.statusText);
      }
      const data = await res.json();
      const moviesArray = Array.isArray(data.SaveMovies) ? data.SaveMovies : [];
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of moviesArray) {
        const movieId = movie._id || movie.movieId;
        if (movieId && !seen.has(movieId)) {
          seen.add(movieId);
          uniqueMovies.push(movie);
        }
      }

      setWatchLaterMovies(uniqueMovies);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(err.message || "Unexpected error occurred.");
      setWatchLaterMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId);
      fetchWatchLaterMovies(userId);
    } else {
      setIsLoading(false);
      setError("No user ID specified.");
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Loading */}
      {isLoading && (
        <div className="text-center text-gray-600 mt-10">Loading saved movies...</div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-600 text-center mt-10">{error}</p>
      )}

      {/* No Movies */}
      {!isLoading && !error && watchLaterMovies.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No saved movies found for this user.</p>
      )}

      {/* Movie Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {watchLaterMovies.map((movie) => (
          <div
            key={movie._id || movie.movieId}
            className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            <img
              src={movie.poster_url || "https://via.placeholder.com/150"}
              alt={movie.title || "Untitled"}
              className="w-full h-64 object-cover"
            />
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">
                {movie.title || "Untitled"}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdUserWatchLaterPage;
