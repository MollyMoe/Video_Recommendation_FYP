import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Star } from "lucide-react";
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StFilterContent = ({ searchQuery }) => {
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  // Add state for the popup message
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    console.log("📦 Fetching personalized recommendations and sorting them by rating.");
  const fetchExpandedRecommendationsWithPriority = async () => {
    if (!savedUser?.userId) {
      console.log("No user ID found. Skipping movie fetch.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [likedRes, recommendedRes] = await Promise.all([
        axios.get(`${API}/api/movies/top-liked`),
        axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`)
      ]);

      const likedMovieIds = likedRes.data.map(item => String(item.movieId));
      let recommendedMovies = recommendedRes.data;

      if (!Array.isArray(recommendedMovies)) {
        console.error("Recommendations API did not return an array. Using empty array.");
        recommendedMovies = [];
      }

      // Prioritise recommended movies that are in liked database
      const inLiked = [];
      const notInLiked = [];

      for (const movie of recommendedMovies) {
        if (likedMovieIds.includes(String(movie.movieId))) {
          inLiked.push(movie);
        } else {
          notInLiked.push(movie);
        }
      }

      // Sort both lists by predicted rating
      const sortedInLiked = inLiked.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));
      const sortedNotInLiked = notInLiked.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));

      // Combine, prioritise liked database over user recommendations
      const finalList = [...sortedInLiked, ...sortedNotInLiked];

      console.log("🎬 Final prioritized list of recommended movies:", finalList);

      setAllMovies(finalList);
      setMovies(finalList);
    } catch (err) {
      console.error("Failed to fetch liked & recommended movies:", err);
      setMovies([]);
      setAllMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  fetchExpandedRecommendationsWithPriority();
}, [savedUser?.userId]);

  useEffect(() => {
    const trimmedQuery = searchQuery?.trim().toLowerCase();
    
    if (!trimmedQuery) {
      setMovies(allMovies);
      return;
    }

    // New filtering logic that handles arrays and filters the allMovies list
    const filtered = allMovies.filter(movie => {
        const title = movie.title?.toLowerCase() || "";
        const director = movie.director?.toLowerCase() || "";
        const overview = movie.overview?.toLowerCase() || "";
        const actors = (Array.isArray(movie.actors) ? movie.actors.join(" ").toLowerCase() : movie.actors?.toLowerCase()) || "";
        const genres = (Array.isArray(movie.genres) ? movie.genres.join(" ").toLowerCase() : movie.genres?.toLowerCase()) || "";
        const producers = (Array.isArray(movie.producers) ? movie.producers.join(" ").toLowerCase() : movie.producers?.toLowerCase()) || "";

        return (
            title.includes(trimmedQuery) ||
            director.includes(trimmedQuery) ||
            overview.includes(trimmedQuery) ||
            actors.includes(trimmedQuery) ||
            genres.includes(trimmedQuery) ||
            producers.includes(trimmedQuery)
        );
    });

    setMovies(filtered);
  }, [searchQuery, allMovies]);

  const handleHistory = async (movie) => {
    if (!movie?.movieId || !savedUser?.userId) return;
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: savedUser.userId, movieId: movie.movieId }),
      });
      if (movie.trailer_url) {
        window.open(movie.trailer_url, "_blank");
      }
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
      setPopupMessage("Saved to Watch Later!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
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
      setPopupMessage("Movie liked!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (err) {
      console.error("Error liking movie:", err);
    }
  };

  return (
    <div className="pt-8 px-4 min-h-screen">
      <div className="max-w-xl mx-auto space-y-4">
        {isLoading && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-lg font-semibold">Loading movies...</p>
              <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-bold text-gray-200 mb-4">Top 10 Rated movies based on your Recommendations</h2>

        {movies.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 mt-20">
            No movies found.
          </div>
        ) : (
          movies.slice(0, 10).map((movie, index) => (
            <div
              key={movie._id || movie.movieId}
              className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => setSelectedMovie(movie)}
            >
              <div className="text-xl font-bold w-8 text-center text-purple-600 dark:text-yellow-400">
                {index + 1}
              </div>
              <img
                src={movie.poster_url || "https://placehold.co/80x120?text=No+Image"}
                alt={movie.title || "Movie Poster"}
                className="w-16 h-24 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0 ml-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {movie.title || "Unknown Title"}
                </h2>
              </div>
              <div className="text-right flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500" />
                <div className="flex flex-col items-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {movie.predicted_rating?.toFixed(1) || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedMovie} onClose={() => setSelectedMovie(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl relative">
            <div className="flex space-x-6">
              <img
                src={selectedMovie?.poster_url}
                alt={selectedMovie?.title}
                className="rounded-lg w-40 h-auto object-cover"
              />
              <div className="flex flex-col justify-center space-y-3 flex-grow">
                <h2 className="text-2xl font-semibold">{selectedMovie?.title}</h2>
                <p className="text-sm text-gray-700">{Array.isArray(selectedMovie?.genres) ? selectedMovie.genres.join(", ") : selectedMovie?.genres}</p>
                <p className="text-sm text-gray-700"><strong>Director:</strong> {selectedMovie?.director || "N/A"}</p>
                <p className="text-sm text-gray-700">
                  <strong>Actors:</strong> {Array.isArray(selectedMovie?.actors) ? selectedMovie.actors.join(", ") : selectedMovie?.actors || "N/A"}
                </p>
                <p className="text-sm text-gray-700"><strong>Overview:</strong> {selectedMovie?.overview || "N/A"}</p>
                <p className="text-sm text-gray-700"><strong>Rating: ⭐</strong> {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}</p>
              </div>
            </div>

            <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => handleHistory(selectedMovie)}
              >
                <Play className="w-3 h-3 mr-1 fill-black" />
                Play
              </button>
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => handleLike(selectedMovie.movieId)}
              >
                <Heart className="w-4 h-4 mr-1 fill-black" />
                Like
              </button>
              <button
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                onClick={() => handleWatchLater(selectedMovie.movieId)}
              >
                <Bookmark className="w-4 h-4 mr-1 fill-black" />
                Save
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
            
            {showPopup && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-purple-800 px-4 py-2 rounded shadow text-sm z-50">
                {popupMessage}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default StFilterContent;