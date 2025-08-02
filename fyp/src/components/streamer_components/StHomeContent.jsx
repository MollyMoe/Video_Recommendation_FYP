import { useEffect, useState, useMemo  } from "react";
import axios from "axios";
import { debounce } from "lodash";

// Import movie components
import MovieCarousel from "../movie_components/MovieCarousel";
import MovieCard from "../movie_components/MovieCard";
import MovieModal from "../movie_components/MovieModal";
import FilterButtons from "../movie_components/FilterButtons";

import { API } from "@/config/api";

function StHomeContent({ userId, searchQuery }) {

  const [movies, setMovies] = useState([]);
  const [lastRecommendedMovies, setLastRecommendedMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [allShownTitles, setAllShownTitles] = useState(new Set());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [regenerateIndex, setRegenerateIndex] = useState(0);


  // Carousel States
  const [topLikedMovies, setTopLikedMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [savedMovies, setSavedMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [interactionCounts, setInteractionCounts] = useState({ liked: 0, saved: 0, watched: 0 });
  const [likedTitles, setLikedTitles] = useState([]);
  const [savedTitles, setSavedTitles] = useState([]);
  const [watchedTitles, setWatchedTitles] = useState([]);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;

  const [activeSort, setActiveSort] = useState('default');
  const [activeGenres, setActiveGenres] = useState([]);

  const [searchSort, setSearchSort] = useState('default');
  const [searchGenres, setSearchGenres] = useState([]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  
  const allAvailableGenres = useMemo(() => {
    const genres = new Set();
    lastRecommendedMovies.forEach(movie => {
      movie.genres?.forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [lastRecommendedMovies]);

  const displayedMovies = useMemo(() => {
    let processedMovies = [...lastRecommendedMovies];

    // 1. Apply Multiple Genre Filters
    // We check if the array has items, not just if it exists.
    if (activeGenres.length > 0) {
      processedMovies = processedMovies.filter(movie => {
        if (!movie.genres || movie.genres.length === 0) return false;
        // We use `.every()` to ensure the movie has ALL of the selected genres.
        return activeGenres.every(filterGenre => movie.genres.includes(filterGenre));
      });
    }

    // 2. Apply Sorting
    if (activeSort === 'rating') {
      processedMovies.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));
    } else if (activeSort === 'year_desc' || activeSort === 'year_asc') {
      const extractYear = (title) => {
        const match = title.match(/\((\d{4})\)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      processedMovies.sort((a, b) => {
        const yearA = extractYear(a.title);
        const yearB = extractYear(b.title);
        return activeSort === 'year_desc' ? yearB - yearA : yearA - yearB;
      });
    }
    
    return processedMovies;
  }, [lastRecommendedMovies, activeSort, activeGenres]);

  const displayedSearchMovies = useMemo(() => {
  let filtered = [...movies];

  if (searchGenres.length > 0) {
    filtered = filtered.filter(movie =>
      movie.genres && searchGenres.every(g => movie.genres.includes(g))
    );
  }

  if (searchSort === 'rating') {
    filtered.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));
  } else if (searchSort === 'year_desc' || searchSort === 'year_asc') {
    const extractYear = (title) => {
      const match = title.match(/\((\d{4})\)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    filtered.sort((a, b) => {
      const yearA = extractYear(a.title);
      const yearB = extractYear(b.title);
      return searchSort === 'year_desc' ? yearB - yearA : yearA - yearB;
    });
  }

  return filtered;
}, [movies, searchGenres, searchSort]);

  // --- EVENT HANDLERS FOR FILTERS ---
  const handleFilterAndSort = (payload) => {
    // This function can handle updates for sorting, genres, or both.
    if (payload.sort !== undefined) {
      setActiveSort(payload.sort);
    }
    if (payload.genres !== undefined) {
      setActiveGenres(payload.genres);
    }
  };

  const clearAllFilters = () => {
    setActiveSort('default');
    setActiveGenres([]); // Reset to an empty array
  };

  const handleSearchFilterAndSort = (payload) => {
  if (payload.sort !== undefined) setSearchSort(payload.sort);
  if (payload.genres !== undefined) setSearchGenres(payload.genres);
};

const clearSearchFilters = () => {
  setSearchSort('default');
  setSearchGenres([]);
};

  // EVENT HANDLER FUNCTIONS
  const normalizeMovie = (movie) => {
    if (!movie) return null;
    if (typeof movie.genres === "string") {
      movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
    }
    const match = movie.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    movie.trailer_key = match ? match[1] : null;
    return movie;
  };
  

const fetchUserAndMovies = async () => {
  if (!savedUser?.userId || !username) return;
  setIsLoading(true);

  try {
    let userGenres = [];

    if (isOnline) {
      try {
        const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        userGenres = userRes.data.genres || [];
        setPreferredGenres(userGenres);

        if (window.electron?.saveUserGenres) {
          window.electron.saveUserGenres(userGenres);
        }
      } catch (err) {
        console.warn("⚠️ Online genre fetch failed. Trying offline...");
      }
    }

    // Fallback to offline genres if still empty
    if (!userGenres.length && window.electron?.getUserGenres) {
      try {
        const offlineGenres = await window.electron.getUserGenres();
        userGenres = offlineGenres || [];
        setPreferredGenres(userGenres);
      } catch (offlineErr) {
        console.error("❌ Failed to load offline genres:", offlineErr);
      }
    }

    const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";
    let moviesToDisplay = [];

    if (refreshNeeded && isOnline) {
      console.log("🔄 Refresh needed after settings change. Regenerating...");
      localStorage.removeItem("refreshAfterSettings");

      const response = await axios.post(`${API}/api/movies/regenerate`, {
        userId: savedUser.userId,
        excludeTitles: Array.from(allShownTitles),
      });

      moviesToDisplay = response.data || [];
      if (window.electron?.saveRecommendedMovies) {
        window.electron.saveRecommendedMovies(moviesToDisplay);
      }

    } else if (isOnline) {
      try {
        console.log("🌐 Fetching last saved recommendations...");
        const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);

        if (recRes.data?.length > 0) {
          moviesToDisplay = recRes.data;
          if (window.electron?.saveRecommendedMovies) {
            window.electron.saveRecommendedMovies(moviesToDisplay);
          }
        } else {
          console.log("🆕 No recs found. Generating...");
          const response = await axios.post(`${API}/api/movies/regenerate`, {
            userId: savedUser.userId,
            excludeTitles: []
          });
          moviesToDisplay = response.data || [];

          if (window.electron?.saveRecommendedMovies) {
            window.electron.saveRecommendedMovies(moviesToDisplay);
          }
        }

      } catch (err) {
        console.warn("⚠️ Online fetch failed. Trying offline...");
      }
    }

    // Fallback to offline recommendations
    if (!moviesToDisplay.length && window.electron?.getRecommendedMovies) {
      try {
        const offlineMovies = await window.electron.getRecommendedMovies();
        console.log(`📦 Loaded ${offlineMovies.length} offline recommendations.`);
        moviesToDisplay = offlineMovies;
      } catch (offlineErr) {
        console.error("❌ Failed to load offline recommendations:", offlineErr);
      }
    }

    const normalizedMovies = moviesToDisplay.map(normalizeMovie).filter(Boolean);
    setLastRecommendedMovies(normalizedMovies.slice(0, 60));
    setAllShownTitles(new Set(normalizedMovies.map((m) => m.title)));

  } catch (err) {
    console.error("❌ Error in fetchUserAndMovies:", err);
  } finally {
    setIsLoading(false);
  }
};


  const handleRegenerate = async () => {
  if (!isSubscribed) return;
  setIsLoading(true);

  try {
    if (isOnline) {
      const response = await axios.post(`${API}/api/movies/regenerate`, {
        userId: savedUser.userId,
        excludeTitles: Array.from(allShownTitles),
      });

      const newMovies = (response.data || []).map(normalizeMovie).filter(Boolean);

      if (!newMovies.length) {
        setPopupMessage("No new movies found. Try adjusting your preferences!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        const newTitles = newMovies.map(m => m.title);
        setMovies(newMovies);
        setLastRecommendedMovies(newMovies);
        setAllShownTitles(prev => new Set([...prev, ...newTitles]));

        if (window.electron?.saveRecommendedMovies) {
          window.electron.saveRecommendedMovies(response.data);
        }

        setRegenerateIndex(1);
      }

    } else {
      // OFFLINE
      if (!window.electron?.getRecommendedMovies) {
        throw new Error("Offline API not available");
      }

      const offlinePool = await window.electron.getRecommendedMovies();
      const normalized = offlinePool.map(normalizeMovie).filter(Boolean);

      const start = regenerateIndex * 60;
      const nextBatch = normalized.slice(start, start + 60);

      if (!nextBatch.length) {
        setPopupMessage("No more offline recommendations available.");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        return;
      }

      const newTitles = nextBatch.map(m => m.title);
      setMovies(nextBatch);
      setLastRecommendedMovies(nextBatch);
      setAllShownTitles(prev => new Set([...prev, ...newTitles]));

      setRegenerateIndex(prev => prev + 1);
    }

  } catch (err) {
    console.error("❌ Failed to regenerate movies:", err);
  } finally {
    setIsLoading(false);
  }
};


const handleHistory = (movie) => {
    if (!isSubscribed || !movie) return;
    handleAction('history', movie.movieId);
    if (movie.trailer_url) {
      window.open(movie.trailer_url, "_blank");
    }
  };

  // === USEEFFECT HOOKS ===
  useEffect(() => {
    if (savedUser?.userId && username) {
      fetchUserAndMovies();
    }
  }, [savedUser?.userId, username]);

  useEffect(() => {
    if (savedUser?.userId) {
      axios.get(`${API}/api/subscription/${savedUser.userId}`)
        .then(res => setIsSubscribed(res.data.isActive))
        .catch(() => setIsSubscribed(false));
    }
  }, [savedUser?.userId]);

    useEffect(() => {
    // Exit early if we don't have the user ID yet.
    if (!savedUser?.userId) return;

    // Define a single, unified async function to fetch all carousel data.
    const fetchAllCarouselData = async () => {
      try {
        console.log("--- Starting Carousel Data Fetch ---");

        // --- Parallel Fetches ---
        const [topLikedRes, likedTitlesRes, savedTitlesRes, watchedTitlesRes] = await Promise.all([
          axios.get(`${API}/api/movies/top-liked`),
          axios.get(`${API}/api/movies/likedMovies/${savedUser.userId}`),
          axios.get(`${API}/api/movies/watchLater/${savedUser.userId}`),
          axios.get(`${API}/api/movies/historyMovies/${savedUser.userId}`),
        ]).catch(err => [ { data: [] }, { data: {} }, { data: {} }, { data: {} } ]);

        setTopLikedMovies(topLikedRes.data.map(m => normalizeMovie(m.details)).filter(Boolean));
        setLikedTitles(likedTitlesRes.data?.likedMovies?.slice(0, 2).map(m => m.title) || []);
        setSavedTitles(savedTitlesRes.data?.SaveMovies?.slice(0, 2).map(m => m.title) || []);
        setWatchedTitles(watchedTitlesRes.data?.historyMovies?.slice(0, 2).map(m => m.title) || []);

        // --- Sequential Fetches ---
        const countsRes = await axios.get(`${API}/api/movies/counts/${savedUser.userId}`);
        const { liked, saved, watched } = countsRes.data;
        setInteractionCounts({ liked, saved, watched });
        
        const seenIds = new Set();

        // ✅ CONSOLIDATED AND CORRECTED LOGIC ✅
        const fetchAndSetMovies = async (type, condition, endpoint, setter, seen) => {
          if (condition) {
            console.log(`✅ Condition met for ${type}. Fetching recommendations...`);
            const res = await axios.post(endpoint, { userId: savedUser.userId, excludeIds: Array.from(seen) });
            const movies = res.data.map(normalizeMovie).filter(Boolean);
            console.log(`Received ${movies.length} ${type} recommendations.`);
            setter(movies);
            movies.forEach(m => seen.add(String(m.movieId)));
          } else {
            console.log(`❌ Condition NOT met for ${type}. Clearing movies.`);
            setter([]);
          }
        };

        await fetchAndSetMovies("LIKED", liked >= 5, `${API}/api/movies/als-liked`, setLikedMovies, seenIds);
        await fetchAndSetMovies("SAVED", saved >= 5, `${API}/api/movies/als-saved`, setSavedMovies, seenIds);
        await fetchAndSetMovies("WATCHED", watched >= 5, `${API}/api/movies/als-watched`, setWatchedMovies, seenIds);

        console.log("--- Carousel Data Fetch Complete ---");
      } catch (err) {
        console.error("💥 A critical error occurred in fetchAllCarouselData:", err);
      }
    };
    
    fetchAllCarouselData();
  }, [savedUser?.userId]); // This hook only needs to re-run if the user ID changes.

  useEffect(() => {
    const trimmedQuery = searchQuery?.trim();
    if (!isSubscribed || !trimmedQuery) {
      setMovies(lastRecommendedMovies);
      return;
    }
    const debouncedFetch = debounce(async () => {
      try {
        const res = await axios.get(`${API}/api/movies/search`, { params: { q: trimmedQuery } });
        setMovies((res.data || []).map(normalizeMovie).filter(Boolean).slice(0, 60));
      } catch (err) {
        console.error("Search failed:", err);
        setMovies([]);
      }
    }, 500);
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchQuery, isSubscribed, lastRecommendedMovies]);

  // A simple boolean to determine if we are in "search mode"
  const isSearching = searchQuery?.trim().length > 0 && isSubscribed;

  // === RENDER ===
  return (
    <div className="sm:ml-64 pt-10 px-4 sm:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* **CONDITIONAL LAYOUT SWITCH** */}
        {isSearching ? (
          // --- SEARCH RESULTS VIEW ---
          <div className="mt-15">
            <h2 className="text-2xl font-semibold text-black mb-4 px-4">Search Results</h2>
              {isSubscribed && (
                <FilterButtons
                  allGenres={allAvailableGenres}
                  onFilterAndSort={handleSearchFilterAndSort}
                  onClear={clearSearchFilters}
                  currentSort={searchSort}
                  currentGenres={searchGenres}
                />
              )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ml-15">
              {displayedSearchMovies.length > 0 ? (
                displayedSearchMovies.map((movie) => (
                  <MovieCard key={movie._id || movie.movieId} movie={movie} onClick={setSelectedMovie} />
                ))
              ) : (
                !isLoading && <p className="col-span-full text-center text-gray-500 mt-8">No movies found for your search.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            {/* Carousels Section */}
            <div className="mt-15">
              <MovieCarousel
                title="🔥 Most Liked Movies"
                movies={topLikedMovies}
                onMovieClick={setSelectedMovie}
                autoScroll={true} 
              />
              
              {/* These carousels will NOT auto-scroll because the prop is not passed (it defaults to false) */}
              {interactionCounts.liked >= 5 && likedMovies.length > 0 && (
                <MovieCarousel
                  title={<>Because you like <span className="italic text-purple-500">{likedTitles.join(", ")}</span></>}
                  movies={likedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}
              
              {interactionCounts.saved >= 5 && savedMovies.length > 0 && (
                <MovieCarousel
                  title={<>Because you save <span className="italic text-green-500">{savedTitles.join(", ")}</span></>}
                  movies={savedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}
              
              {interactionCounts.watched >= 5 && watchedMovies.length > 0 && (
                <MovieCarousel
                  title={<>Because you watch <span className="italic text-orange-500">{watchedTitles.join(", ")}</span></>}
                  movies={watchedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}
            </div>

            {/* Main Recommendations Grid */}
            <div>
              <div className="flex justify-between items-center mb-4 px-4">
                <h2 className="text-2xl font-semibold text-black">Recommended for You</h2>
                <button
                  onClick={handleRegenerate}
                  disabled={!isSubscribed || isLoading}
                  className="font-medium border border-gray-400 px-6 py-2 rounded-lg text-sm shadow-md disabled:opacity-50 bg-white text-black hover:bg-gray-200 transition-transform active:scale-95"
                >
                  Regenerate
                </button>
              </div>

                {isSubscribed && isOnline && (
                  <FilterButtons
                    allGenres={allAvailableGenres}
                    onFilterAndSort={handleFilterAndSort}
                    onClear={clearAllFilters}
                    currentSort={activeSort}
                    currentGenres={activeGenres}
                  />
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ml-20">
                {displayedMovies.map((movie) => (
                  <MovieCard key={movie._id || movie.movieId} movie={movie} onClick={setSelectedMovie} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL & OVERLAYS (Unaffected by the layout switch) --- */}
      <MovieModal
        isOpen={!!selectedMovie}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        isSubscribed={isSubscribed}
        onPlay={handleHistory}
        onLike={(movieId) => handleAction('like', movieId)}
        onSave={(movieId) => handleAction('save', movieId)}
        onDelete={(movieId) => handleAction('delete', movieId)}
        isSearching={isSearching}
        >
        {showPopup && popupMessage}
      </MovieModal>

      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading Movie...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

export default StHomeContent;