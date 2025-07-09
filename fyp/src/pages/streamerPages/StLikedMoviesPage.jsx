import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);

  const fetchLikedMovies = async (userId) => {
    try {
      const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
      const data = await res.json();

      console.log("🎬 Liked movies response:", data);

      // Remove duplicates by _id or movieId
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of data.likedMovies || []) {
        const id = movie._id || movie.movieId;
        if (!seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        }
      }

      setLikedMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch liked movies:", err);
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchLikedMovies(savedUser.userId);
    }
  }, []);


  // play
  const handlePlay = async (movieId, trailerUrl) => {
    if (!movieId || !savedUser?.userId) return;

    try {
      const res = await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId: movieId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save to history");
      const data = await res.json();
      console.log("📚 History updated:", data);

      if (trailerUrl) {
        window.open(trailerUrl, "_blank");
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
    }
  };

  const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) {
      console.warn("Missing movieId or userId");
      return;
    }
  
    try {
      const res = await fetch(`${API}/api/movies/unlike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId: movieId,
        }),
      });
  
      const data = await res.json();
      console.log("❌ Remove response:", data);
  
      // Optionally update UI
      setLikedMovies((prev) => prev.filter((m) => m.movieId !== movieId));
    } catch (err) {
      console.error("❌ Error removing liked movie:", err);
    }
  };
  

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {likedMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No liked movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {likedMovies.map((movie) => (
                <div
                  key={movie._id || movie.movieId}
                  className="bg-white rounded-lg shadow p-2"
                >
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="rounded mb-2 w-full h-60 object-cover"
                  />
                  <h3 className="text-sm font-semibold">{movie.title}</h3>


                  <div className="flex justify-center gap-2 mt-2">

                  {/* play btn */}
                  <button
                    onClick={() => {
                      console.log("▶️ Play clicked for:", movie.movieId);
                      handlePlay(movie.movieId);

                      if (movie.trailer_url) {
                        window.open(movie.trailer_url, "_blank");
                      }
                    }}
                    className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                  >
                    <Play className="w-3 h-3 mr-1 fill-black" />
                    Play
                  </button>
                  
                  {/* remove btn */}
                  <button
                    onClick={() => handleRemove(movie.movieId)}
                    className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200 mt-1"
                  >
                    <Trash2 className="w-3 h-3 mr-1 fill-black" />
                    Remove
                  </button>
                  </div>

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
