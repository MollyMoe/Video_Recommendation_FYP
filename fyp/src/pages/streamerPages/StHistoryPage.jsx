import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StHistoryPage = () => {
  const [movies, setMovies] = useState([]);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/api/history/${savedUser.userId}`);
        const data = await res.json();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    if (savedUser?.userId) {
      fetchHistory();
    }
  }, []);

  return (
    <div className="p-4 min-h-screen dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-white mb-6">Watch History</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map((movie, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-2">
            <img src={movie.poster_url} alt={movie.title} className="rounded mb-2 w-full h-60 object-cover" />
            <h3 className="text-sm font-semibold">{movie.title}</h3>
            <p className="text-xs text-gray-500">{movie.genres?.join(", ")}</p>
            <p className="text-xs">⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StHistoryPage;
