import React, { useEffect, useState } from "react";
import axios from "axios";
import offlineFallback from "../../images/offlineFallback.jpg";


function Recommendations({ userId }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
    
      useEffect(() => {
        const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    
        window.addEventListener("online", handleOnlineStatus);
        window.addEventListener("offline", handleOnlineStatus);
    
        return () => {
          window.removeEventListener("online", handleOnlineStatus);
          window.removeEventListener("offline", handleOnlineStatus);
        };
      }, []);

useEffect(() => {
  if (!userId) return;

  const fetchAndCleanMovies = (rawMovies) => {
    return rawMovies
      .filter(movie =>
        movie.poster_url &&
        movie.trailer_url &&
        typeof movie.poster_url === "string" &&
        typeof movie.trailer_url === "string" &&
        movie.poster_url.toLowerCase() !== "nan" &&
        movie.trailer_url.toLowerCase() !== "nan" &&
        movie.poster_url.trim() !== "" &&
        movie.trailer_url.trim() !== ""
      )
      .map(movie => {
        // Normalize genres
        if (typeof movie.genres === "string") {
          movie.genres = movie.genres.split(/[,|]/).map(g => g.trim());
        }

        // Normalize actors
        if (typeof movie.actors === "string") {
          movie.actors = movie.actors.split(",").map(a => a.trim()).filter(Boolean);
        } else if (!Array.isArray(movie.actors)) {
          movie.actors = [];
        }

        // Normalize producers
        if (typeof movie.producers === "string") {
          movie.producers = movie.producers.split(",").map(p => p.trim()).filter(Boolean);
        } else if (!Array.isArray(movie.producers)) {
          movie.producers = [];
        }

        movie.director =
          typeof movie.director === "string" && movie.director.trim() !== ""
            ? movie.director
            : "N/A";
        movie.overview =
          typeof movie.overview === "string" && movie.overview.trim() !== ""
            ? movie.overview
            : "N/A";

        return movie;
      });
  };

  const loadRecommendations = async () => {
    try {
      let rawMovies = [];
      if (isOnline) {
        // Fetch from server
        const res = await axios.get(
          `http://localhost:3001/api/movies/recommendations/${userId}`
        );
        rawMovies = res.data || [];

        // Save locally (limit 500 handled inside preload)
        await window.electronAPI.saveRecommendedMovies(rawMovies);
      } else {
        // Load from local cache
        rawMovies = await window.electronAPI.getRecommendedMovies();
      }

      const cleanedMovies = fetchAndCleanMovies(rawMovies);
      setMovies(cleanedMovies);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  loadRecommendations();
}, [userId, isOnline]);



  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (movies.length === 0) return <p>No recommendations found.</p>;

  return (
    <div className="text-white p-4">
      <h2 className="text-xl font-bold mb-4">Your Recommended Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div key={movie._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold">{movie.title || "Untitled"}</h3>
            <img
            src={movie.poster_url || offlineFallback}
            alt={movie.title}
            className="w-full h-full object-cover rounded mt-2"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== offlineFallback) {
                e.currentTarget.src = offlineFallback;
              }
            }}
          />
            <p className="text-sm mt-2"><strong>Genres:</strong> {movie.genres?.join(", ") || "N/A"}</p>
            <p className="text-sm mt-1"><strong>Director:</strong> {movie.director}</p>
            <p className="text-sm mt-1"><strong>Overview:</strong> {movie.overview}</p>
            <p className="text-sm mt-1"><strong>Actors:</strong> {movie.actors.length > 0 ? movie.actors.join(", ") : "N/A"}</p>
            <p className="text-sm mt-1"><strong>Producers:</strong> {movie.producers.length > 0 ? movie.producers.join(", ") : "N/A"}</p>
            <p className="text-sm mt-1"><strong>Rating:</strong> ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}</p>

            {movie.trailer_url && (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 text-sm underline block mt-2"
              >
                Watch Trailer
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export default Recommendations;
