import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StWatchLaterPage = () => {
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
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">History</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map((movie) => (
          <div key={movie._id} className="bg-white rounded-lg shadow p-2">
            <img src={movie.posterUrl} alt={movie.title} className="rounded mb-2" />
            <h3 className="text-sm font-semibold">{movie.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StWatchLaterPage;
