import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

function StHomeContent() {
  const [movies, setMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;
  const localKey = `regeneratedMovies_${username}`;

  useEffect(() => {
    const fetchUserAndMovies = async () => {
      const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

      // If settings were changed, clear cached movies
      if (refreshNeeded) {
        localStorage.removeItem(localKey);
        localStorage.removeItem("refreshAfterSettings");
      }

      // Use cache if available and no refresh is needed
      const saved = localStorage.getItem(localKey);
      if (saved && !refreshNeeded) {
        setMovies(JSON.parse(saved));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        const userGenres = userRes.data.genres || [];
        setPreferredGenres(userGenres);

        const movieRes = await axios.get(`${API}/api/movies/all`);
        const validMovies = movieRes.data
          .filter((movie) =>
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

        const seen = new Set();
        const uniqueMovies = validMovies.filter((m) => {
          if (seen.has(m.title)) return false;
          seen.add(m.title);
          return true;
        });

        const normalized = userGenres.map((g) => g.toLowerCase().trim());
        const filtered = uniqueMovies.filter((m) =>
          m.genres?.some((g) => normalized.includes(g.toLowerCase().trim()))
        );

        const finalList = userGenres.length > 0 ? filtered : uniqueMovies;
        setMovies(finalList);
        localStorage.setItem(localKey, JSON.stringify(finalList));
      } catch (err) {
        console.error("Error fetching user or movies:", err);
        setMovies([]);
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
      .filter((movie) =>
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

    if (regenerated.length === 0) {
      alert("No new recommendations found in your preferred genres.");
      return;
    }

    const combined = [...regenerated, ...movies];
    const seen = new Set();
    const deduped = combined.filter((m) => {
      if (seen.has(m.title)) return false;
      seen.add(m.title);
      return true;
    });

    setMovies(deduped);
    localStorage.setItem(localKey, JSON.stringify(deduped));
  } catch (err) {
    console.error("Regenerate error:", err);
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading your recommended movies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRegenerate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm shadow-md"
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
                  src={movie.poster_url}
                  alt={movie.title}
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
                <p className="text-sm text-gray-700"><strong>Actors:</strong> {selectedMovie?.actors || "N/A"}</p>
                <p className="text-sm text-gray-700"><strong>Overview:</strong> {selectedMovie?.overview || "N/A"}</p>
                <p className="text-sm text-gray-700">Predicted Rating: ⭐ {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedMovie(null)}
                className="border border-gray-400 text-gray-800 py-1 px-6 rounded-xl hover:bg-gray-100 text-sm"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default StHomeContent;
