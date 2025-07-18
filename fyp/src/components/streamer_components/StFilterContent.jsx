import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StFilterContent = ({searchQuery}) => {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  
  const [preferredGenres, setPreferredGenres] = useState([]);

  useEffect(() => {
    console.log("📦 Running fetchMovies()");
    // Clear state and fetch fresh data every time page mounts
    setQuery("");
    setMovies([]);
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    if (!savedUser?.userId) return;

    setIsLoading(true);
    try {
      
      let allMovieList = [];
      const res = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
      allMovieList = res.data;

      console.log("🎬 Frontend received:", allMovieList);
   

      setAllMovies(allMovieList);
      setMovies(allMovieList);
    } catch (err) {
      console.error("Failed to fetch recommended movies:", err);
    }
    setIsLoading(false);
  };

  const handleHistory = async (movieId) => {
    if (!movieId || !savedUser?.userId) return;
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
    } catch (err) {
      console.error("❌ Error saving history:", err);
    }
  };

  const handleWatchLater = async (movieId) => {
    if (!movieId || !savedUser?.userId) return;
    try {
      await fetch(`${API}/api/movies/watchLater`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId }),
      });
    } catch (err) {
      console.error("Save movie:", err);
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

  // Update movie list based on search query
  useEffect(() => {
    if (!searchQuery?.trim()) {
      const filteredByGenres = allMovies.filter(movie =>
        movie.genres?.some(genre => preferredGenres.includes(genre))
      );
      setMovies(filteredByGenres);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allMovies.filter(movie =>
      movie.title?.toLowerCase().includes(lowerQuery) ||
      movie.actors?.toLowerCase().includes(lowerQuery) ||
      movie.director?.toLowerCase().includes(lowerQuery) ||
      (Array.isArray(movie.genres) && movie.genres.some(g => g.toLowerCase().includes(lowerQuery)))
    );
    setMovies(filtered);
  }, [searchQuery, allMovies, preferredGenres]);

  return (
    <div className="sm:ml-64 pt-50 px-8 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 max-w-3xl mx-auto">
                {isLoading && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
                    <p className="text-lg font-semibold">Loading movies...</p>
                    <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                </div>
                )}
              
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
                {movies.map((movie) => (
                    <div
                    key={movie._id}
                    className="relative cursor-pointer group w-[180px] mx-auto"
                    onClick={() => setSelectedMovie(movie)}
                    >
                    <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                    <img
                    src={movie.poster_url || "https://placehold.co/150x225?text=No+Image"}
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

        {/* Dialog Modal */}
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
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => {
                  handleHistory(selectedMovie.movieId);
                  if (selectedMovie?.trailer_url) {
                    window.open(selectedMovie.trailer_url, "_blank");
                  }
                }}
              >
                <Play className="w-3 h-3 mr-1 fill-black" />
                Play
              </button>
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => {
                  handleLike(selectedMovie.movieId)}}
              >
                <Heart className="w-4 h-4 mr-1 fill-black" />
                Like
              </button>
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => {
                  handleWatchLater(selectedMovie.movieId)}}
              >
                <Bookmark className="w-4 h-4 mr-1 fill-black" />
                Save
              </button>
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Trash2 className="w-4 h-4 mr-1 stroke-black" />
                Delete
              </button>
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
};


export default StFilterContent


