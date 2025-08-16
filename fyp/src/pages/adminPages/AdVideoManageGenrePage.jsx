
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdSideButtons from "../../components/admin_components/AdSideButtons";



const API = import.meta.env.VITE_API_BASE_URL;

const AdVideoManageGenrePage = () => {
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(true); 

  // Fetch all genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoadingGenres(true);
        const res = await axios.get(`${API}/api/movies/all-genres`);
        setGenres(res.data);
      } catch (err) {
        console.error("❌ Failed to load genres", err);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Fetch movies when selectedGenres changes
  useEffect(() => {
    if (selectedGenres.length === 0) {
      setMovies([]);
      return;
    }

    const fetchMovies = async () => {
      setLoadingMovies(true);
      try {
        const queryString = selectedGenres.join(",");
        const res = await axios.get(`${API}/api/movies/byGenres?genres=${queryString}`);
        setMovies(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch movies by genres", err);
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, [selectedGenres]);

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const clearGenres = () => {
    setSelectedGenres([]);
  };

  return (
    <>
      <AdSideButtons />
      <div className="p-6 bg-white dark:bg-gray-900 min-h-screen ">
        <h1 className="text-black text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🎞️ Filter Movies by Genre
        </h1>
        {/* Genre Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {loadingGenres ? (
            <div className="text-gray-800 dark:text-white text-sm animate-pulse">
              🔄 Loading genres...
            </div>
          ) : (
            genres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  selectedGenres.includes(genre)
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {genre}
              </button>
            ))
          )}

          {/* Clear All */}
          {!loadingGenres && selectedGenres.length > 0 && (
            <button
              onClick={clearGenres}
              className="px-4 py-2 rounded-lg border text-sm font-medium bg-red-600 text-white border-red-700 hover:bg-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Loading indicator */}
        {loadingMovies && selectedGenres.length > 0 && (
          <div className="text-black dark:text-white font-medium text-lg mb-4">
            🔄 Loading movies for:{" "}
            <span className="text-purple-400">{selectedGenres.join(", ")}</span>...
          </div>
        )}

        {/* Movies list */}
        {!loadingMovies && selectedGenres.length > 0 && movies.length > 0 && (
          <div className="space-y-5">
            {movies.map((movie, index) => (
              <div
                key={movie.movieId || index}
                className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >


                {/* Poster */}
                <img
                  src={movie.poster_url || "https://via.placeholder.com/80x120?text=No+Image"}
                  alt={movie.title || "Movie Poster"}
                  className="w-24 h-36 object-cover rounded-md"
                />

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                    {movie.title || "Unknown Title"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Genres: {movie.genres || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No movies found */}
        {!loadingMovies && selectedGenres.length > 0 && movies.length === 0 && (
          <div className="text-black text-center mt-10">⚠️ No movies found for selected genres.</div>
        )}
      </div>
    </>
  );
};

export default AdVideoManageGenrePage;
