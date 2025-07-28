import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark, Trash2 } from "lucide-react";
import { debounce } from "lodash";

const API = import.meta.env.VITE_API_BASE_URL;

function StHomeContent({ userId, searchQuery }) {
  const [movies, setMovies] = useState([]);
  const [allFetchedMovies, setAllFetchedMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRecommendedMovies, setLastRecommendedMovies] = useState([]);
  const [actionLoading, setActionLoading] = useState(false); // aft clicking delete btn, loads UI
  
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;

    //pop up message, loading
    const [popupMessage, setPopupMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

      // fetch recommendation again
  const fetchRecommended = async () => {
    if (!username || !savedUser?.userId) return [];

    setActionLoading(true);
    try {
      const res = await fetch(
        `${API}/api/movies/recommendations/${savedUser.userId}`
      );
      const data = await res.json();
      setMovies(data || []);
      setLastRecommendedMovies(data || []);
      return data || []; // ✅ return for use in delete handler
    } catch (err) {
      console.error("❌ Fetch error:", err);
      return []; // fallback in error case
    } finally {
      setActionLoading(false);
    }
  };

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
        setLastRecommendedMovies(fetchedMovies.slice(0, 99));
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
       setIsLoading(true); // added 
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

        // ✅ Only display the first 99 *after* adding the next batch
        setMovies(regenerated.slice(0, 99));
        setLastRecommendedMovies(deduped.slice(0, 99));

        // Save full set back to backend
        await axios.post(`${API}/api/movies/store-recommendations`, {
          userId: savedUser.userId,
          movies: regenerated.slice(0, 99), 
         });
      } catch (err) {
        console.error("❌ Failed to regenerate movies:", err);
      }
      setIsLoading(false); // added 
    };

// add search
    useEffect(() => {
      const trimmed = searchQuery?.trim();
      if (!trimmed) {
        setMovies(lastRecommendedMovies.slice(0, 99));
        return;
      }

      const debouncedFetch = debounce(async () => {
        try {
          const res = await axios.get(`${API}/api/movies/search`, {
            params: { q: trimmed },
          });

          const seen = new Set();
          const deduped = res.data
            .filter((movie) => {
              if (!movie.title || seen.has(movie.title)) return false;
              seen.add(movie.title);
              return true;
            })
            .map((movie) => {
              if (typeof movie.genres === "string") {
                movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
              }

              const match = movie.trailerurl?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
              movie.trailer_key = match ? match[1] : null;

              return movie;
            });

          setMovies(deduped.slice(0, 99));
        } catch (err) {
          console.error("Search failed:", err);
          setMovies([]);
        }
      }, 500);

      debouncedFetch();
      return () => debouncedFetch.cancel();
    }, [searchQuery]);


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

    setPopupMessage("Saved to Watch Later!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);

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

      setPopupMessage("Movie liked!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);

    } catch (err) {
      console.error("Error liking movie:", err);
    }
  };

   // remove the movie
  const handleRemoveRecommended = async (movieId) => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser || !savedUser.userId) return;

    try {
      const res = await fetch(`${API}/api/movies/recommended/delete`, {
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
      // Re-fetch updated data
      const updated = await fetchRecommended();

      // ✅ Log total movie count after reload
      console.log(
        "🎬 Recommended movies count (after delete):",
        updated.length
      );

      // Optionally refresh UI or show pop-up
      setPopupMessage("Removed from recommended");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000); // if using a success popup
      fetchRecommended(); // or re-fetch data to update UI
    } catch (error) {
      console.error("❌ Failed to remove from recommended:", error);
    }
  };

  //top rated movies 
  const [topLikedMovies, setTopLikedMovies] = useState([]);
useEffect(() => {
  const fetchCountsAndRecommendations = async (userId) => {
    try {
      const res = await axios.get(`${API}/api/movies/counts/${userId}`);
      const { liked, saved, watched } = res.data;
      setInteractionCounts({ liked, saved, watched });

      const seenIds = new Set();
      const promises = [];

      // Fetch top-liked movies (not user-specific)
      axios.get(`${API}/api/movies/top-liked`)
        .then((res) => {
          const topLiked = res.data
            .map(m => normalizeMovie(m.details))
            .filter(m => !!m); // Remove nulls
          setTopLikedMovies(topLiked);
        })
        .catch(err => {
          console.error("❌ Failed to fetch top liked:", err);
        });

      // Continue with liked/save/watch logic as before...
      // 🟣 Liked
      if (liked >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-liked`, {
            userId,
            excludeIds: [],
          }).then((res) => {
            const filtered = res.data.filter(m => !seenIds.has(String(m.movieId)));
            const normalized = filtered.map(normalizeMovie);
            setLikedMovies(normalized);
            normalized.forEach((m) => seenIds.add(String(m.movieId)));
          })
        );
      }

      // 🟢 Saved
      if (saved >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-saved`, {
            userId,
            excludeIds: Array.from(seenIds),
          }).then((res) => {
            const filtered = res.data.filter(m => !seenIds.has(String(m.movieId)));
            const normalized = filtered.map(normalizeMovie);
            setSavedMovies(normalized);
            normalized.forEach((m) => seenIds.add(String(m.movieId)));
          })
        );
      }

      //  Watched
      if (watched >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-watched`, {
            userId,
            excludeIds: Array.from(seenIds),
          }).then((res) => {
            const filtered = res.data.filter(m => !seenIds.has(String(m.movieId)));
            const normalized = filtered.map(normalizeMovie);
            setWatchedMovies(normalized);
            normalized.forEach((m) => seenIds.add(String(m.movieId)));
          })
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("❌ ALS fetch error:", err);
    }
  };

  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (savedUser?.userId) {
    fetchCountsAndRecommendations(savedUser.userId);
  }
}, []);


  //for because you like/save/watch
// ALS-based "Because you like/save/watch" section
const [likedMovies, setLikedMovies] = useState([]);
const [savedMovies, setSavedMovies] = useState([]);
const [watchedMovies, setWatchedMovies] = useState([]);
const [interactionCounts, setInteractionCounts] = useState({ liked: 0, saved: 0, watched: 0 });

const [likedTitles, setLikedTitles] = useState([]);
const [savedTitles, setSavedTitles] = useState([]);
const [watchedTitles, setWatchedTitles] = useState([]);


const normalizeMovie = (movie) => {
  if (typeof movie.genres === "string") {
    movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
  }

  const match = movie.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  movie.trailer_key = match ? match[1] : null;

  if (movie.predicted_rating !== undefined && movie.predicted_rating !== null) {
    const num = Number(movie.predicted_rating);
    movie.predicted_rating = isNaN(num) ? null : num;
  } else {
    movie.predicted_rating = null;
  }

  return movie;
};



useEffect(() => {
  const fetchCountsAndRecommendations = async (userId) => {
    try {
      const res = await axios.get(`${API}/api/movies/counts/${userId}`);
      const { liked, saved, watched } = res.data;
      setInteractionCounts({ liked, saved, watched });

      const seenIds = new Set();
      const promises = [];

      if (liked >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-liked`, { userId, excludeIds: [] })
            .then(res => {
              const movies = res.data.filter(m => !seenIds.has(String(m.movieId)));
              const normalized = movies.map(normalizeMovie);
              setLikedMovies(normalized);
              normalized.forEach(m => seenIds.add(String(m.movieId)));
            })
            .catch(err => console.error("❌ ALS liked error:", err.message))
        );
      }

      if (saved >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-saved`, { userId, excludeIds: Array.from(seenIds) })
            .then(res => {
              const movies = res.data.filter(m => !seenIds.has(String(m.movieId)));
              const normalized = movies.map(normalizeMovie);
              setSavedMovies(normalized);
              normalized.forEach(m => seenIds.add(String(m.movieId)));
            })
            .catch(err => console.error("❌ ALS saved error:", err.message))
        );
      }

      if (watched >= 5) {
        promises.push(
          axios.post(`${API}/api/movies/als-watched`, { userId, excludeIds: Array.from(seenIds) })
            .then(res => {
              const movies = res.data.filter(m => !seenIds.has(String(m.movieId)));
              const normalized = movies.map(normalizeMovie);
              setWatchedMovies(normalized);
              normalized.forEach(m => seenIds.add(String(m.movieId)));
            })
            .catch(err => console.error("❌ ALS watched error:", err.message))
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("❌ Failed to load interaction counts:", err.message);
    }
  };

  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (savedUser?.userId) {
    fetchCountsAndRecommendations(savedUser.userId);
  }
}, []);


useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser?.userId) return;

  const fetchInteractionTitles = async () => {
    try {
      const [likedRes, savedRes, watchedRes] = await Promise.all([
        axios.get(`${API}/api/movies/likedMovies/${savedUser.userId}`),
        axios.get(`${API}/api/movies/watchLater/${savedUser.userId}`),
        axios.get(`${API}/api/movies/historyMovies/${savedUser.userId}`),
      ]);

      setLikedTitles(likedRes.data.likedMovies?.slice(0, 2).map(m => m.title) || []);
      setSavedTitles(savedRes.data.SaveMovies?.slice(0, 2).map(m => m.title) || []);
      setWatchedTitles(watchedRes.data.historyMovies?.slice(0, 2).map(m => m.title) || []);
    } catch (err) {
      console.error("❌ Error fetching interaction titles:", err);
    }
  };

  fetchInteractionTitles();
}, []);




  return (
          
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          {/*  top rated movies */}
          {topLikedMovies.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-2 px-4">🔥 Most Liked Movies</h2>
              <div className="overflow-x-auto py-2">
                <div className="flex gap-50 px-23 pr-30">
                  {topLikedMovies.map((movie) => (
                    <div key={movie._id} className="w-48 flex-shrink-0">
                      <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

            {/* ALS-based sections only if user has ≥ 5 interactions */}
            {/*  Because you like */}
            {interactionCounts.liked >= 5 && likedMovies.length > 0 && (
              <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-2 px-4">
                Because you like{" "}
                {likedTitles.slice(0, 2).map((title, idx) => (
                  <span key={idx} className="italic text-purple-300">
                    {title}
                    {idx === 0 && likedTitles.length > 1 ? ", " : ""}
                  </span>
                ))}
              </h2>
                <div className="overflow-x-auto py-2">
                  <div className="flex gap-50 px-23 pr-30">
                    {likedMovies.map((movie) => (
                      <div key={movie._id} className="w-48 flex-shrink-0">
                        <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/*  Because you save */}
            {interactionCounts.saved >= 5 && savedMovies.length > 0 && (
              <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-2 px-4">
                Because you save{" "}
                {savedTitles.slice(0, 2).map((title, idx) => (
                  <span key={idx} className="italic text-green-300">
                    {title}
                    {idx === 0 && savedTitles.length > 1 ? ", " : ""}
                  </span>
                ))}
              </h2>
                <div className="overflow-x-auto py-2">
                  <div className="flex gap-50 px-23 pr-30">
                    {savedMovies.map((movie) => (
                      <div key={movie._id} className="w-48 flex-shrink-0">
                        <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/*  Because you watch */}
            {interactionCounts.watched >= 5 && watchedMovies.length > 0 && (
              <div className="mb-10">
              <h2 className="text-xl font-semibold text-white mb-2 px-4">
                Because you watch{" "}
                {watchedTitles.slice(0, 2).map((title, idx) => (
                  <span key={idx} className="italic text-orange-300">
                    {title}
                    {idx === 0 && watchedTitles.length > 1 ? ", " : ""}
                  </span>
                ))}
              </h2>
                <div className="overflow-x-auto py-2">
                  <div className="flex gap-50 px-23 pr-30">
                    {watchedMovies.map((movie) => (
                      <div key={movie._id} className="w-48 flex-shrink-0">
                        <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


      {/* Dialog for the because section */}
          <Dialog
          open={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          className="relative z-50"
         >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="relative bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
              <div className="flex space-x-6">
                <img
                  src={selectedMovie?.poster_url}
                  alt={selectedMovie?.title}
                  className="rounded-lg w-40 h-auto object-cover"
                />
                <div className="flex flex-col justify-center space-y-3 flex-grow">
                  <h2 className="text-2xl font-semibold">
                    {selectedMovie?.title}
                  </h2>
                  <p className="text-sm text-gray-700">
                    <strong>Genres:</strong>{" "}
                    {Array.isArray(selectedMovie?.genres)
                      ? selectedMovie.genres.join(", ")
                      : selectedMovie?.genres || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Director:</strong> {selectedMovie?.director || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Actors:</strong>{" "}
                    {Array.isArray(selectedMovie?.actors)
                      ? selectedMovie.actors.join(", ")
                      : selectedMovie?.actors || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Overview:</strong> {selectedMovie?.overview || "N/A"}
                  </p>
                  <p className="font-semibold text-sm">
                    ⭐{selectedMovie?.predicted_rating !== undefined
                          ? Number(selectedMovie.predicted_rating).toFixed(1)
                          : "N/A"}
                    </p>
                </div>
              </div>
              <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    console.log("▶️ Play clicked for:", selectedMovie?.movieId);
                    handleHistory(selectedMovie?.movieId);
  
                    // Optional: open trailer
                    if (selectedMovie?.trailer_url) {
                      window.open(selectedMovie.trailer_url, "_blank");
                    }
                  }}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Play className="w-3 h-3 mr-1 fill-black" />
                  Play
                </button>
                <button
                  onClick={() => handleLike(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Heart className="w-4 h-4 mr-1 fill-black" />
                  Like
                </button>
                <button
                  onClick={() => handleWatchLater(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Bookmark className="w-4 h-4 mr-1 fill-black" />
                  Save
                </button>
                <button
                  onClick={() => handleRemoveRecommended(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Trash2 className="w-4 h-4 mr-1 stroke-black" />
                  Delete
                </button>
              </div>
  
              {showPopup && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2  text-purple-800 px-4 py-2 rounded shadow text-sm z-50">
                  {popupMessage}
                </div>
              )}
  
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

            {/* normal home content */}
          <div className="fixed top-[23px] left-4/10 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
            <button
              onClick={handleRegenerate}
              className="bg-white font-medium text-black border border-gray-400 hover:bg-gray-200 px-7.5 py-2.5 rounded-lg text-sm shadow-md"
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
        <Dialog
          open={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="relative bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
              <div className="flex space-x-6">
                <img
                  src={selectedMovie?.poster_url}
                  alt={selectedMovie?.title}
                  className="rounded-lg w-40 h-auto object-cover"
                />
                <div className="flex flex-col justify-center space-y-3 flex-grow">
                  <h2 className="text-2xl font-semibold">
                    {selectedMovie?.title}
                  </h2>
                  <p className="text-sm text-gray-700">
                    <strong>Genres:</strong>{" "}
                    {Array.isArray(selectedMovie?.genres)
                      ? selectedMovie.genres.join(", ")
                      : selectedMovie?.genres || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Director:</strong> {selectedMovie?.director || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Actors:</strong>{" "}
                    {Array.isArray(selectedMovie?.actors)
                      ? selectedMovie.actors.join(", ")
                      : selectedMovie?.actors || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Overview:</strong> {selectedMovie?.overview || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Rating: ⭐</strong>{" "}
                    {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    console.log("▶️ Play clicked for:", selectedMovie?.movieId);
                    handleHistory(selectedMovie?.movieId);
  
                    // Optional: open trailer
                    if (selectedMovie?.trailer_url) {
                      window.open(selectedMovie.trailer_url, "_blank");
                    }
                  }}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Play className="w-3 h-3 mr-1 fill-black" />
                  Play
                </button>
                <button
                  onClick={() => handleLike(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Heart className="w-4 h-4 mr-1 fill-black" />
                  Like
                </button>
                <button
                  onClick={() => handleWatchLater(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Bookmark className="w-4 h-4 mr-1 fill-black" />
                  Save
                </button>
                <button
                  onClick={() => handleRemoveRecommended(selectedMovie.movieId)}
                  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                >
                  <Trash2 className="w-4 h-4 mr-1 stroke-black" />
                  Delete
                </button>
              </div>
  
              {showPopup && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2  text-purple-800 px-4 py-2 rounded shadow text-sm z-50">
                  {popupMessage}
                </div>
              )}
  
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
  
        {isLoading && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-lg font-semibold">Loading movies...</p>
              <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
            </div>
          </div>
        )}
        {showPopup && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)]  flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-lg font-semibold">{popupMessage}</p>
            </div>
          </div>
        )}
  
        {actionLoading && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-lg font-semibold">Loading...</p>
              <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
            </div>
          </div>
        )}
      </div>
    );
  }

  //for the because section 
function MovieCard({ movie, onClick }) {
  return (
    <div
      className="relative cursor-pointer w-[180px] group"
      onClick={() => onClick(movie)}
    >
      {/* Movie Poster */}
      <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
        <img
          src={movie.poster_url || "https://via.placeholder.com/150"}
          alt={movie.title || "No title"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Trailer Preview on Hover */}
      {movie.trailer_key && (
        <div className="absolute left-1/2 top-9 transform -translate-x-1/2 w-[350px] z-50 hidden group-hover:block">
          <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}`}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full object-cover"
              title={movie.title}
            ></iframe>
          </div>
          <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl space-y-1">
            <div>{Array.isArray(movie.genres) ? movie.genres.join(", ") : movie.genres}</div>
            <div className="font-semibold text-sm">
              ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


  
  export default StHomeContent;
  
  