import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trash2, CheckCircle } from "lucide-react";

import { API } from "@/config/api";

const AdUserHistoryPage = () => {
  const { id: userId } = useParams();
  const [user, setUser] = useState(null);
  const [historyMovies, setHistoryMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${userId}`);
        if (!res.ok) throw new Error("User details not found");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      }
    };

    const fetchHistoryMovies = async () => {
      try {
        const res = await fetch(`${API}/api/movies/historyMovies/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch history movies");
        const data = await res.json();
        const moviesArray = Array.isArray(data.historyMovies) ? data.historyMovies : [];
        const uniqueMovies = [...new Map(moviesArray.map(m => [(m._id || m.movieId), m])).values()];
        setHistoryMovies(uniqueMovies);
      } catch (err) {
        console.error("Failed to fetch history movies:", err);
        setError(err.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
      fetchHistoryMovies();
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Page Header */}
      <h2 className="text-2xl font-semibold text-center mb-6">
        Watch History for <span className="font-bold">{user?.username || "User"}</span>
      </h2>

      {/* Loading / Error / Empty */}
      {isLoading ? (
        <div className="text-center text-gray-600 mt-10">Loading watch history...</div>
      ) : error ? (
        <p className="text-red-600 text-center mt-10">{error}</p>
      ) : historyMovies.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No watch history found for this user.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {historyMovies.map((movie) => (
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
      )}
    </div>
  );
};

export default AdUserHistoryPage;