import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { Play, Trash2, CheckCircle } from "lucide-react";
import { API } from "@/config/api";

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);

  const fetchLikedMovies = async (userId) => {
    // if (!username || !savedUser?.userId) return;
    if (!userId) {
      console.warn("⚠️ No userId provided");
      return;
    }

    console.log("🔗 Fetching liked movies for user:", userId);
    console.log("🌐 API Base URL:", API);
    console.log("📡 Full endpoint:", `${API}/api/movies/likedMovies/${userId}`);
  

    setIsLoading(true);

    const start = Date.now(); // Track start time
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
    } finally {
      const elapsed = Date.now() - start;
      const minDelay = 500; // milliseconds

      setTimeout(() => {
        setIsLoading(false);
      }, Math.max(0, minDelay - elapsed)); // ensure at least 500ms visible
    }
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      fetchLikedMovies(savedUser.userId);
    }
  }, []);

  const handlePlay = async (movieId, trailerUrl) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!movieId || !savedUser?.userId) return;

    console.log("▶️ Trailer URL:", trailerUrl);

    // ✅ Open immediately before async/await
    let newTab = null;
    if (trailerUrl) {
      newTab = window.open("", "_blank"); // open empty tab immediately
    }

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

      if (newTab && trailerUrl) {
        newTab.location.href = trailerUrl; // ✅ now load trailer
      }
    } catch (err) {
      console.error("❌ Error playing movie:", err);
      if (newTab) newTab.close(); // if error, close tab
    }
  };

  const handleRemove = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!movieId || !savedUser?.userId) {
      console.warn("Missing movieId or userId");
      return;
    }

    try {
      const res = await fetch(`${API}/api/movies/likedMovies/delete`, {
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
      console.log("🗑️ Remove response:", data);

      console.log(
        "Before removal:",
        likedMovies.map((m) => typeof m.movieId),
        typeof movieId
      );

      // ✅ Remove movie from frontend UI state
      setLikedMovies((prev) =>
        prev.filter((m) => m.movieId.toString() !== movieId.toString())
      );

      setShowSuccess(true); // ✅ show popup
      setTimeout(() => setShowSuccess(false), 2000); // auto-hide
    } catch (err) {
      console.error("❌ Error removing liked movie:", err);
    }
  };

  return (
    <div className="p-4">
      <StNav />

      <StSideBar />
      <div className="sm:ml-64 pt-20 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {likedMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">
              No liked movies found.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
              {likedMovies.map((movie) => (


                <div
                  key={movie._id || movie.movieId}
                  className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[350px]"
                >
                  {/* Movie Poster */}
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="w-full h-64 object-cover"
                  />

                  {/* Title + Buttons */}
                  <div className="flex flex-col flex-1 px-4 pt-3 pb-2">
                    {/* Title with grow */}
                    <h3 className="text-sm font-semibold text-black line-clamp-2 flex-grow m-0 ">
                      {movie.title || "Untitled"}
                    </h3>

                    {/* Buttons close to title */}
                    <div className="m-0 flex justify-center gap-3">
                    {/* play btn */}
                    <button
                      onClick={() => {
                        console.log("▶️ Play clicked for:", movie.movieId);
                        handlePlay(movie.movieId, movie.trailer_url); // ✅ Pass trailerUrl here
                      }}
                      className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                    >
                      <Play className="w-3 h-3 mr-1 fill-black" />
                      Play
                    </button>

                    {/* remove btn */}
                    <button
                      onClick={() => handleRemove(movie.movieId)}
                      className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                    >
                      <Trash2 className="w-3 h-3 mr-1 fill-black" />
                      Remove
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading Liked Movies</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-violet-500" />
            </div>
            <span className="font-medium">Movie removed from liked list!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StLikedMoviesPage;