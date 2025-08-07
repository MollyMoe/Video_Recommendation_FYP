
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trash2, CheckCircle } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserLikedMoviesPage = () => {
  const { id: userId } = useParams();
  const [user, setUser] = useState(null);
  const [likedMovies, setLikedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchLikedMovies = async (userIdToFetch) => {
    if (!userIdToFetch) {
      setIsLoading(false);
      setError("No user ID found to fetch liked movies.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/movies/likedMovies/${userIdToFetch}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || res.statusText);
      }
      const data = await res.json();
      const moviesArray = Array.isArray(data.likedMovies) ? data.likedMovies : [];
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of moviesArray) {
        const movieId = movie._id || movie.movieId;
        if (movieId && !seen.has(movieId)) {
          seen.add(movieId);
          uniqueMovies.push(movie);
        }
      }

      setLikedMovies(uniqueMovies);
    } catch (err) {
      console.error("Error fetching liked movies:", err);
      setError(err.message || "Unexpected error occurred.");
      setLikedMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId);
      fetchLikedMovies(userId);
    } else {
      setIsLoading(false);
      setError("No user ID specified.");
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Loading, Error, or Empty */}
      {isLoading && (
        <div className="text-center text-gray-600 mt-10">Loading liked movies...</div>
      )}

      {error && (
        <p className="text-red-600 text-center mt-10">{error}</p>
      )}

      {!isLoading && !error && likedMovies.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No liked movies found for this user.</p>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {likedMovies.map((movie) => (
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

export default AdUserLikedMoviesPage;
