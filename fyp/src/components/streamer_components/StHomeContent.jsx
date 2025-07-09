import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

function StHomeContent({ searchQuery }) {
  const [movies, setMovies] = useState([]);
  const [allFetchedMovies, setAllFetchedMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const username = savedUser?.username;

  useEffect(() => {
    const fetchUserAndMovies = async () => {
      if (!username || !savedUser?.userId) return;
      setIsLoading(true);
      try {
        const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        const userGenres = userRes.data.genres || [];
        setPreferredGenres(userGenres);

        // Step 1: Try to load from recommendations
        setIsLoading(true);

          let fetchedMovies = [];
          const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

          if (!refreshNeeded) {
            const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
            fetchedMovies = recRes.data;
          }

          if (refreshNeeded || !fetchedMovies || fetchedMovies.length === 0) {
            localStorage.removeItem("refreshAfterSettings");
        // let fetchedMovies = [];
        // const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

        // if (!refreshNeeded) {
        //   const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
        //   fetchedMovies = recRes.data;
        // }

        // if (refreshNeeded || !fetchedMovies || fetchedMovies.length === 0) {
        //   localStorage.removeItem("refreshAfterSettings");
          
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

          const unique = [];
          const seen = new Set();
          for (const movie of validMovies) {
            if (!seen.has(movie.title)) {
              seen.add(movie.title);
              unique.push(movie);
            }
          }

          const normalizedPreferred = userGenres.map((g) => g.toLowerCase().trim());
          fetchedMovies = unique.filter(
            (movie) =>
              Array.isArray(movie.genres) &&
              movie.genres.some((genre) =>
                normalizedPreferred.some((pref) => genre.toLowerCase().trim().includes(pref))
              )
          );

          // Update DB with new list
          await axios.post(`${API}/api/movies/store-recommendations`, {
            userId: savedUser.userId,
            movies: fetchedMovies,
          });
        }
        
        setMovies(fetchedMovies);
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
      console.log("🔁 Sending POST to /api/movies/regenerate...");
      const response = await axios.post(`${API}/api/movies/regenerate`, {
        genres: preferredGenres,
        excludeTitles: movies.map((m) => m.title),
      });
      console.log("✅ Regenerated movies:", response.data);

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

      const updated = [...regenerated, ...movies];
      const seenTitles = new Set();
      const deduped = updated.filter((m) => {
        if (seenTitles.has(m.title)) return false;
        seenTitles.add(m.title);
        return true;
      });

      setMovies(deduped);
     
      // Update saved list after regeneration
      await axios.post(`${API}/api/movies/store-recommendations`, {
        userId: savedUser.userId,
        movies: deduped,
      });

    } catch (err) {
      console.error("❌ Failed to regenerate movies:", err);
    }
  };

  useEffect(() => {
    if (!searchQuery?.trim()) {
      // When search is empty, show movies filtered by user preferred genres
      const filteredByGenres = allFetchedMovies.filter(movie =>
        movie.genres?.some(genre => preferredGenres.includes(genre))
      );
      setMovies(filteredByGenres);
      return;
    }

    // When search query is active, search in all movies ignoring genre filter
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allFetchedMovies.filter((movie) => {
      return (
        movie.title?.toLowerCase().includes(lowerQuery) ||
        movie.director?.toLowerCase().includes(lowerQuery) ||
        (Array.isArray(movie.genres) && movie.genres.some(g => g.toLowerCase().includes(lowerQuery)))
      );
    });
    setMovies(filtered);
  }, [searchQuery, allFetchedMovies, preferredGenres]);

const handleLike = async (movieId) => {
  if (!movieId || !savedUser?.userId) {
    console.warn("Missing movieId or userId");
    return;
  }

  try {
    const res = await fetch(`${API}/api/movies/like`, {
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
      console.error("Like failed:", res.status, errorText);
      return;
    }

    const data = await res.json();
    console.log("Like response:", data);
  } catch (err) {
    console.error("Error liking movie:", err);
  }
};


  return (
    <div className="min h-screen sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRegenerate}
            className="bg-white text-black border border-black hover:bg-gray-100 px-4 py-2 rounded-lg text-sm shadow-md"
          >
            Regenerate Movies
          </button>
        </div>
        {isLoading ? (
          <p className="text-center text-white">Loading movies...</p>
        ) : movies.length === 0 ? (
          <p className="text-center text-white">No movies found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <div
                key={movie._id}
                className="relative cursor-pointer group w-[180px] mx-auto"
                onMouseEnter={() => setHoveredMovieId(movie._id)}
                onMouseLeave={() => setHoveredMovieId(null)}
                onClick={() => setSelectedMovie(movie)}
              >
                <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No title"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {hoveredMovieId === movie._id && (
                  <div className="absolute left-1/2 top-9 transform -translate-x-1/2 w-[350px] z-10">
                    <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
                      <iframe
                        key={movie.trailer_key}
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
        )}
      </div>

      <Dialog
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        className="relative z-50"
      >
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
                <p className="text-sm text-gray-700">
                  {selectedMovie?.genres?.join(", ")}
                </p>
                <p className="text-sm text-gray-700">
                  Predicted Rating: ⭐️ {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                </p>
                <p className="text-sm text-gray-700">
                  Director: {selectedMovie?.director || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Play className="w-3 h-3 mr-1 fill-black" />
                Play
              </button>
              <button
                onClick={() => {
                  console.log("Like button clicked for movie:", selectedMovie?.movieId);
                  handleLike(selectedMovie.movieId);
                }}
                className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
              >
                <Heart className="w-4 h-4 mr-1 fill-black" />
                Like
              </button>
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
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
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default StHomeContent;
