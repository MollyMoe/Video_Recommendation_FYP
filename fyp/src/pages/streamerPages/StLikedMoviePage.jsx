import { useEffect, useState } from "react";
import axios from "axios";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

const API = import.meta.env.VITE_API_BASE_URL;

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  const fetchLikedMovies = async () => {
    if (!savedUser?.userId) return;
    try {
      const { data } = await axios.get(
        `${API}/api/movies/likedMovies/${savedUser.userId}`
      );
      setLikedMovies(data.likedMovies || []);
    } catch (err) {
      console.error("Failed to fetch liked movies:", err);
    }
  };

  useEffect(() => {
    fetchLikedMovies();
  }, [savedUser?.userId]);

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />

      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          {likedMovies.length === 0 ? (
            <p className="text-center mt-10">No liked movies found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {likedMovies.map((movie) => (
                <div key={movie._id} className="bg-white rounded-lg shadow p-2">
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="rounded mb-2"
                  />
                  <h3 className="text-sm font-semibold">{movie.title}</h3>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StLikedMoviesPage;
