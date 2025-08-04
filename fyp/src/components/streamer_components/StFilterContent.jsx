import axios from "axios";
import { useState, useEffect } from "react";
import MovieModal from "../movie_components/MovieModal";
import MovieCard from "../movie_components/MovieCard";
import { API } from "@/config/api";

const StFilterContent = ({ searchQuery }) => {
  const [movies, setMovies] = useState([]);
  const [lastRecommendedMovies, setLastRecommendedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (searchQuery?.trim()) {
      fetchMovies();
    } else {
      setMovies([]);
    }
  }, [searchQuery]);

  useEffect(() => {
  if (selectedMovie) {
    console.log("🎬 Selected movie:", selectedMovie);
  }
}, [selectedMovie]);

const fetchMovies = async () => {
  if (!savedUser?.userId) return;

  try {
    const res = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
    let allMovieList = res.data;

    const normalizeString = (str) => (str || "").replace(/[|,]/g, " ").toLowerCase();

    if (searchQuery?.trim()) {
      const queryLower = searchQuery.toLowerCase();

      allMovieList = allMovieList.filter(movie => {
        const title = (movie.title || "").toLowerCase();
        const director = (movie.director || "").toLowerCase();

        const producers = normalizeString(movie.producers);
        const genres = normalizeString(movie.genres);
        const actors = normalizeString(movie.actors);

        return (
          title.includes(queryLower) ||
          director.includes(queryLower) ||
          producers.includes(queryLower) ||
          genres.includes(queryLower) ||
          actors.includes(queryLower)
        );
      });
    }
  const finalMovieSet = allMovieList.slice(0, 1000).map(movie => {
    const url = movie.trailer_url || "";
    let trailer_key = null;

    if (url.includes("v=")) {
      trailer_key = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      trailer_key = url.split("youtu.be/")[1].split("?")[0];
    }

    return {
      ...movie,
      trailer_key,
      genres: movie.genres ? movie.genres.replace(/\|/g, ", ") : "",
      producers: movie.producers ? movie.producers.replace(/\|/g, ", ") : "",
      actors: movie.actors || "",
    };
  });

    setMovies(finalMovieSet);
  } catch (err) {
    console.error("❌ Failed to fetch recommended movies:", err);
    setMovies([]);
  }
};



    const handleHistory = (movie) => {
    if (!movie) return;
    handleAction('history', movie.movieId);
    if (movie.trailer_url) {
      window.open(movie.trailer_url, "_blank");
    }
  };

    const handleAction = async (actionType, movieId) => {
    if (!movieId || !savedUser?.userId) return;

    const actions = {
      like: { url: "like", message: "Movie Liked!" },
      save: { url: "watchLater", message: "Saved to Watch Later!" },
      delete: { url: "recommended/delete", message: "Removed from recommendations" }
    };

    const action = actions[actionType];
    if (!action) return;

    if (actionType === "delete") {
      setMovies(prev => prev.filter(m => m.movieId !== movieId));
      setLastRecommendedMovies(prev => prev.filter(m => m.movieId !== movieId));
    }

    try {
      await axios.post(`${API}/api/movies/${action.url}`, {
        userId: savedUser.userId,
        movieId
      });

      if (action.message) {
        setPopupMessage(action.message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (err) {
      console.error(`❌ Error with action ${actionType}:`, err);
    }
  };

  return (
    <div className="pt-50 px-8 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {searchQuery?.trim() ? (
        <div className="relative overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ml-20 mt-10">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id || movie.movieId}
                movie={movie}
                onClick={() => setSelectedMovie(movie)}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center mr-23 text-gray-500 mt-10">
          Please enter a search term to see results.
        </p>
      )}

      <MovieModal
        isOpen={!!selectedMovie}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={handleHistory}
        onLike={(movieId) => handleAction("like", movieId)}
        onSave={(movieId) => handleAction("save", movieId)}
        onDelete={(movieId) => handleAction("delete", movieId)}
        isSearching={false}
        isSubscribed={true}
      >
        {showPopup && popupMessage}
      </MovieModal>
    </div>
  );
};

export default StFilterContent;