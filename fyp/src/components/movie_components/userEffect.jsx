//needed for user-specific recommendations
import React, { useEffect, useState } from "react";
import axios from "axios";

function Recommendations({ userId }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);     

  useEffect(() => {
    if (!userId) return; //chnage to fullName?

    axios.get(`http://localhost:3001/api/movies/recommendations/${userId}`)
      .then(res => {
        setMovies(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching recommendations:", err);
        setError("Failed to fetch recommendations");
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (movies.length === 0) return <p>No recommendations found.</p>;

  return (
    <div className="text-white p-4">
      <h2 className="text-xl font-bold mb-4"> Your Recommended Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {movies.map(movie => (
          <div key={movie._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold">{movie.title || "Untitled"}</h3>
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={movie.title} className="w-full h-48 object-cover rounded mt-2" />
            ) : (
              <div className="w-full h-48 bg-gray-600 flex items-center justify-center rounded mt-2">
                <span>No image</span>
              </div>
            )}
            <p className="text-sm mt-2">Genres: {movie.genres?.join(", ") || "N/A"}</p>
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
