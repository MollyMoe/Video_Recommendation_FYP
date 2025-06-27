import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark } from "lucide-react";


  // Regenerate Handler
function StHomeContent() {
  const [groupedRecommendations, setGroupedRecommendations] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Local state

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;
  const userId = savedUser?.userId;

  // Regenerate Handler
  const handleRegenerate = () => {
    console.log("Manual regenerate triggered from button...");
    setRefreshTrigger(prev => prev + 1);
  };


  // Helper function to clean and validate movie data
  const processMovieData = (movies) => {
    return movies.filter(
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
      return movie;
    })
    .filter((movie, index, self) => // Ensure unique movies by title
        index === self.findIndex((m) => m.title === movie.title)
    );
  };

  const fetchGroupedRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    let watchedMovies = [];
    let likedMovies = [];
    let savedMovies = [];
    let genreFilteredMovies = [];
    let preferredGenres = [];

    // --- Fetch User Preferences first (needed for headers and genre filtering) ---
    if (username) {
        try {
            const userRes = await axios.get(`http://localhost:3001/api/users/by-username/${username}`);
            preferredGenres = userRes.data.genres || [];
        } catch (e) {
            console.warn("Failed to fetch user preferences:", e.message);
        }
    }


    try {
      // --- Fetching Logic for each group ---
      if (userId) { // Only attempt to fetch personalized recommendations if userId exists
          // Fetch watched recommendations
          try {
            const watchedResponse = await axios.get(`http://localhost:3001/api/recommendations/watched/${userId}`);
            watchedMovies = processMovieData(watchedResponse.data || []);
          } catch (e) {
            console.warn("Failed to fetch watched recommendations:", e.message);
          }

          // Fetch liked recommendations
          try {
            const likedResponse = await axios.get(`http://localhost:3001/api/recommendations/liked/${userId}`);
            likedMovies = processMovieData(likedResponse.data || []);
          } catch (e) {
            console.warn("Failed to fetch liked recommendations:", e.message);
          }

          // Fetch saved recommendations
          try {
            const savedResponse = await axios.get(`http://localhost:3001/api/recommendations/saved/${userId}`);
            savedMovies = processMovieData(savedResponse.data || []);
          } catch (e) {
            console.warn("Failed to fetch saved recommendations:", e.message);
          }
      }


      // Fetch all movies for genre-based recommendations or general display
      try {
        const allMoviesResponse = await axios.get("http://localhost:3001/api/movies/all");
        const allValidMovies = processMovieData(allMoviesResponse.data || []);

        if (preferredGenres.length > 0) {
          genreFilteredMovies = allValidMovies.filter((movie) =>
            movie.genres?.some((genre) =>
              preferredGenres.some((pref) =>
                genre.toLowerCase().includes(pref.toLowerCase())
              )
            )
          );
        } else {
          // If no preferred genres or no user history, show a general list (e.g., popular/trending)
          genreFilteredMovies = allValidMovies.slice(0, 20); // Just take the first 20 as a general set
        }
      } catch (e) {
        console.warn("Failed to fetch all movies for genre/general recommendations:", e.message);
      }

      // --- Construct the grouped data structure - conditionally include headers ---
      const newGroupedRecommendations = [];

      // Helper to create dynamic header
      const createDynamicHeader = (baseText, moviesArray, defaultSuffix = "") => {
        if (!moviesArray || moviesArray.length === 0) {
          return baseText; // Fallback to generic if no movies
        }
        // Take up to 3 titles for the header
        const titles = moviesArray.slice(0, 3).map(movie => movie.title);
        const joinedTitles = titles.join(", ");
        return `${baseText} ${joinedTitles}...`;
      };


      // Only add "Because you watched..." group if there are watched movies
      if (watchedMovies.length > 0) {
        newGroupedRecommendations.push({
          id: 'watched', // Add an ID for unique key in map
          header: createDynamicHeader("Because you watched", watchedMovies),
          items: watchedMovies,
          layout: 'horizontal' // Explicitly define layout for rendering
        });
      }

      // Only add "Because you liked..." group if there are liked movies
      if (likedMovies.length > 0) {
        newGroupedRecommendations.push({
          id: 'liked',
          header: createDynamicHeader("Because you liked", likedMovies),
          items: likedMovies,
          layout: 'horizontal'
        });
      }

      // Only add "Because you saved..." group if there are saved movies
      if (savedMovies.length > 0) {
        newGroupedRecommendations.push({
          id: 'saved',
          header: createDynamicHeader("Because you saved", savedMovies),
          items: savedMovies,
          layout: 'horizontal'
        });
      }

      // Always add the "Recommended for you" group,
      // and it will now consistently appear after activity-based groups if they exist.
      newGroupedRecommendations.push({
        id: 'genre_recommendations',
        header: preferredGenres.length > 0
         ? `Recommended for you based on your genres (${preferredGenres.join(', ')})`
         : "Recommended for You (Popular/Trending)",
       items: genreFilteredMovies,
        layout: 'grid'
      });

      setGroupedRecommendations(newGroupedRecommendations);

    } catch (err) {
      console.error("Critical error fetching recommendations groups:", err);
      setError("An unexpected error occurred while loading recommendations.");
      // Fallback for critical error, still try to show some general content if possible
      setGroupedRecommendations([
        {
          id: 'genre_fallback',
          header: "Recommended for You (Failed to load personalized content)",
          items: genreFilteredMovies, // Try to populate with any fetched general movies
          layout: 'grid'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [username, userId, refreshTrigger]);

  useEffect(() => {
    fetchGroupedRecommendations();
  }, [fetchGroupedRecommendations]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sm:ml-64 dark:bg-gray-800">
        <p className="text-white text-lg">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center sm:ml-64 dark:bg-gray-800">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  // If no groups are generated (e.g., initial load for new user with no content), display a message
  if (groupedRecommendations.length === 0 && !loading && !error) {
    return (
        <div className="min-h-screen flex items-center justify-center sm:ml-64 dark:bg-gray-800">
            <p className="text-gray-400 text-lg">No recommendations available. Try setting your preferences!</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen sm:ml-64 pt-[100px] px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto mt-24">


        {/* Regenerate Button */}
      <div className="absolute top-[100px] left-[270px] z-40">
        <button
          onClick={handleRegenerate}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition"
        >
          🔁 Regenerate Recommendations
        </button>
      </div>



        {groupedRecommendations.map((group) => ( // Removed groupIndex as key, added group.id
          <div key={group.id} className="recommendation-group mb-12">
            <div className="bg-purple-600 rounded-xl px-6 py-3 inline-block mb-6 shadow-md">
            <h2 className="text-white text-lg font-bold">
              {group.header}
            </h2>
            </div>

            {group.items.length > 0 ? (
                // Conditional rendering based on group.layout
                group.layout === 'grid' ? (
                    // Grid layout for "Recommended for You"
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
                        {group.items.map((movie) => (
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
                                {/* Hover Preview for Grid Items - adjusted positioning slightly */}
                                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 mt-4 w-[350px] z-10 hidden group-hover:block">
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
                            </div>
                        ))}
                    </div>
                ) : (
                    // Horizontal scroll layout for other groups (watched, liked, saved)
                    <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
                        {group.items.map((movie) => (
                            <div
                                key={movie._id}
                                className="relative flex-shrink-0 cursor-pointer group w-[180px]"
                                onClick={() => setSelectedMovie(movie)}
                            >
                                <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                                    <img
                                        src={movie.poster_url || "https://via.placeholder.com/150"}
                                        alt={movie.title || "No title"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Hover Preview for Horizontal Items */}
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
                            </div>
                        ))}
                    </div>
                )
            ) : (
              <div className="text-gray-500 text-sm mb-4">
                No recommendations in this category yet.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog Modal remains the same */}
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
                <h2 className="text-3xl font-semibold mb-10">{selectedMovie?.title}</h2>
                <p className="text-sm text-gray-700 mb-2">
                  {selectedMovie?.genres?.join(", ")}
                </p>
                {/* Show rating in modal*/}
                <p className="text-sm text-gray-700 mb-20">
                  Predicted Rating: ⭐ {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                </p>
                <div className="flex space-x-2 mb-10">
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="bg-black rounded-full p-0.5">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                      <span>Play</span>
                    </div>
                  </button>
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 fill-black" />
                      <span>Like</span>
                    </div>
                  </button>
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <Bookmark className="w-4 h-4 fill-black" />
                      <span>Save</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedMovie(null)}
              className="w-15 border border-gray-400 text-gray-800 py-2 rounded-xl hover:bg-gray-100"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default StHomeContent;