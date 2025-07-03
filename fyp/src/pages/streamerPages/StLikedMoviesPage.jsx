import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StLikedMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
  const fetchLikedMovies = async () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API}/api/movies/likedMovies/${savedUser.userId}`);
      const data = await res.json();
      setLikedMovies(data.likedMovies); // <- store in state
    } catch (err) {
      console.error("Failed to fetch liked movies", err);
    }
  };

  fetchLikedMovies();
}, []);

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
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

export default StLikedMoviesPage;
