import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

function StHomeContent({ userId, searchQuery }) {
  const [movies, setMovies] = useState([]);
  const [allFetchedMovies, setAllFetchedMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;

    useEffect(() => {
    const fetchUserAndMovies = async () => {
      if (!username || !savedUser?.userId) return;
      setIsLoading(true);
      try {
        const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        const userGenres = userRes.data.genres || [];
        setPreferredGenres(userGenres);

        // ✅ Always fetch the full movie list for searching
        const allRes = await axios.get(`${API}/api/movies/all`);
        const validMovies = allRes.data
          .filter(
            (movie) =>
              movie.poster_url &&
              movie.trailer_url &&
              typeof movie.poster_url === "string" &&
              typeof movie.trailer_url === "string" &&
              movie.poster_url.toLowerCase() !== "nan" &&
              movie.trailer_url.toLowerCase() !== "nan" &&
              movie.poster_url.trim() !== "" &&
              movie.trailer_url.trim() !== ""
          )
          .map((movie) => {
            if (typeof movie.genres === "string") {
              movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
            }
            const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            movie.trailer_key = match ? match[1] : null;
            return movie;
          });

        // ✅ Remove duplicates
        const seen = new Set();
        const unique = validMovies.filter((movie) => {
          if (seen.has(movie.title)) return false;
          seen.add(movie.title);
          return true;
        });

        // ✅ Save full list for searching
        setAllFetchedMovies(unique);

        // ✅ Now handle recommendations (only for display)
        let fetchedMovies = [];
        const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

        if (!refreshNeeded) {
          const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
          fetchedMovies = recRes.data;
        }

        if (refreshNeeded || !fetchedMovies || fetchedMovies.length === 0) {
          localStorage.removeItem("refreshAfterSettings");

          const normalizedPreferred = userGenres.map((g) => g.toLowerCase().trim());
          fetchedMovies = unique.filter(
            (movie) =>
              Array.isArray(movie.genres) &&
              movie.genres.some((genre) =>
                normalizedPreferred.some((pref) => genre.toLowerCase().includes(pref))
              )
          );

          await axios.post(`${API}/api/movies/store-recommendations`, {
            userId: savedUser.userId,
            movies: fetchedMovies,
          });
        }

        // ✅ Show only recommended ones at first
        setMovies(fetchedMovies.slice(0, 99));
      } catch (err) {
        console.error("Error loading movies:", err);
        setMovies([]);
        setPreferredGenres([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndMovies();
  }, [username]);


    const handleRegenerate = async () => {
      try {
        const response = await axios.post(`${API}/api/movies/regenerate`, {
          genres: preferredGenres,
          excludeTitles: movies.map((m) => m.title),
        });

        const regenerated = response.data
          .filter(
            (movie) =>
              movie.poster_url &&
              movie.trailer_url &&
              typeof movie.poster_url === "string" &&
              typeof movie.trailer_url === "string" &&
              movie.poster_url.toLowerCase() !== "nan" &&
              movie.trailer_url.toLowerCase() !== "nan" &&
              movie.poster_url.trim() !== "" &&
              movie.trailer_url.trim() !== ""
          )
          .map((movie) => {
            if (typeof movie.genres === "string") {
              movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
            }
            const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            movie.trailer_key = match ? match[1] : null;
            return movie;
          });

        const combined = [...regenerated, ...movies];
        const seen = new Set();
        const deduped = combined.filter((m) => {
          if (seen.has(m.title)) return false;
          seen.add(m.title);
          return true;
        });

        // ✅ Only display the first 100 *after* adding the next batch
        setMovies(deduped.slice(0, movies.length + 100));

        // Save full set back to backend
        await axios.post(`${API}/api/movies/store-recommendations`, {
          userId: savedUser.userId,
          movies: deduped,
        });
      } catch (err) {
        console.error("❌ Failed to regenerate movies:", err);
      }
    };

  useEffect(() => {
    if (!preferredGenres.length) return;
    
    if (!searchQuery?.trim()) {
      const filteredByGenres = allFetchedMovies.filter(movie =>
        Array.isArray(movie.genres) &&
        movie.genres.some(genre =>
          preferredGenres.map(g => g.toLowerCase()).includes(genre.toLowerCase())
        )
      );
      setMovies(filteredByGenres.slice(0, 100));
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();

    const filtered = allFetchedMovies.filter(movie => {
      const title = movie.title?.toLowerCase() || "";
      const actors = movie.actors?.toLowerCase() || "";
      const director = movie.director?.toLowerCase() || "";
      const genres = Array.isArray(movie.genres)
        ? movie.genres.map(g => g.toLowerCase())
        : [];

      return (
        title.includes(lowerQuery) ||
        actors.includes(lowerQuery) ||
        director.includes(lowerQuery) ||
        genres.some(g => g.includes(lowerQuery))
      );
    });

    setMovies(filtered.slice(0, 100));
  }, [searchQuery, allFetchedMovies, preferredGenres]);


const handleHistory = async (movieId) => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!movieId || !savedUser?.userId) {
    console.warn("❌ Missing movieId or userId:", movieId, savedUser?.userId);
    return;
  }

  try {
    console.log("📤 Sending history (play) request for:", movieId);
    const res = await fetch(`${API}/api/movies/history`, {
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

    if (!res.ok) {
      console.error("❌ History POST failed:", res.status, data);
      return;
    }

    console.log("✅ History saved:", data);
  } catch (err) {
    console.error("❌ Error saving history:", err);
  }
};

const handleWatchLater = async (movieId) => {
  if (!movieId || !savedUser?.userId) {
    console.warn("Missing movieId or userId");
    return;
  }

  try {
    const res = await fetch(`${API}/api/movies/watchLater`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: savedUser.userId,
        movieId: movieId,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Save failed:", res.status, errorText);
      return;
    }

    const data = await res.json();
    console.log("Save response:", data);
  } catch (err) {
    console.error("Save  movie:", err);
  }
};

  const handleLike = async (movieId) => {
    if (!movieId || !savedUser?.userId) return;
    try {
      await fetch(`${API}/api/movies/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
    } catch (err) {
      console.error("Error liking movie:", err);
    }
  };

  return (
    <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRegenerate}
            className="bg-white text-black border border-gray-400 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm shadow-md"
          >
            Regenerate Movies
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="relative cursor-pointer group w-[180px] mx-auto"
              onClick={() => setSelectedMovie(movie)}
            >
              <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                <img
                  src={movie.poster_url || "https://via.placeholder.com/150"}
                  alt={movie.title || "No title"}
                  className="w-full h-full object-cover"
                />
              </div>

              {movie.trailer_key && (
                <div className="absolute left-1/2 top-9 transform -translate-x-1/2 w-[350px] z-10 hidden group-hover:block">
                  <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
                    <iframe
                      src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}`}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="w-full h-full object-cover"
                      title={movie.title}
                    ></iframe>
                  </div>
                  <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl space-y-1">
                    <div>{movie.genres?.join(", ")}</div>
                    <div className="font-semibold text-sm">
                      ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedMovie} onClose={() => setSelectedMovie(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex space-x-6">
              <img
                src={selectedMovie?.poster_url}
                alt={selectedMovie?.title}
                className="rounded-lg w-40 h-auto object-cover"
              />
              <div className="flex flex-col justify-center space-y-3 flex-grow">
                  <h2 className="text-2xl font-semibold">{selectedMovie?.title}</h2>
                    <p className="text-sm text-gray-700">{selectedMovie?.genres?.join(", ")}</p>
                    <p className="text-sm text-gray-700"><strong>Director:</strong> {selectedMovie?.director || "N/A"}</p>
                    <p className="text-sm text-gray-700">
                    <strong>Actors:</strong> {Array.isArray(selectedMovie?.actors) ? selectedMovie.actors.join(", ") : selectedMovie?.actors || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700"><strong>Overview:</strong> {selectedMovie?.overview || "N/A"}</p>
                    <p className="text-sm text-gray-700"><strong>Rating: ⭐</strong> {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                    </p>
                </div>
            </div>
            <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
              <button onClick={() => {
                  console.log("▶️ Play clicked for:", selectedMovie?.movieId);
                  handleHistory(selectedMovie?.movieId);

                  // Optional: open trailer
                  if (selectedMovie?.trailer_url) {
                    window.open(selectedMovie.trailer_url, "_blank");
                  }
                }} className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"><Play className="w-3 h-3 mr-1 fill-black" />Play</button>
              <button onClick={() => handleLike(selectedMovie.movieId)} className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"><Heart className="w-4 h-4 mr-1 fill-black" />Like</button>
              <button onClick={() => handleWatchLater(selectedMovie.movieId)} className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"><Bookmark className="w-4 h-4 mr-1 fill-black" />Save</button>
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"><Trash2 className="w-4 h-4 mr-1 stroke-black" />Delete</button>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setSelectedMovie(null)} className="border border-gray-400 text-gray-800 py-1 px-6 rounded-xl hover:bg-gray-100 text-sm">Close</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

export default StHomeContent;