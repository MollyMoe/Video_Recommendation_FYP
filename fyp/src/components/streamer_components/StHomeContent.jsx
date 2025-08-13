import { useEffect, useState, useMemo  } from "react";
import axios from "axios";
import { debounce } from "lodash";

// Import movie components
import MovieCarousel from "../movie_components/MovieCarousel";
import MovieCard from "../movie_components/MovieCard";
import MovieModal from "../movie_components/MovieModal";
import FilterButtons from "../movie_components/FilterButtons";

import { API } from "@/config/api";

function StHomeContent({ searchQuery }) {

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

   const fetchSubscription = async (userId) => {
  try {
    let subscription;

    if (isOnline) {
      const res = await fetch(`${API}/api/subscription/${userId}`);
      subscription = await res.json();
      console.log("🔑 Online subscription data:", subscription);
      window.electron?.saveSubscription(subscription);
    } else {
      const offlineSub = window.electron?.getSubscription();
      subscription = offlineSub?.userId === userId ? offlineSub : null;
      console.log("📦 Offline subscription data:", subscription);
    }

    console.log("🧪 Subscription before setting:", subscription);
    setIsSubscribed(subscription?.isActive === true); // force exact boolean match
  } catch (err) {
    console.error("Failed to fetch subscription:", err);
    setIsSubscribed(false); // fallback
  }
};

useEffect(() => {
  console.log("🎯 Updated isSubscribed:", isSubscribed);
}, [isSubscribed]);

  function normalizeAndEnrich(movie) {
  if (!movie) return null;

  const m = { ...movie };

  // genres: string -> array
  if (typeof m.genres === "string") {
    m.genres = m.genres.split(/[,|]/).map((g) => g.trim());
  }

  // trailer_key from trailer_url
  if (!m.trailer_key && m.trailer_url) {
    const match = m.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (match) m.trailer_key = match[1];
  }

  return m;
}
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

      //added
      // Existing: moviesToDisplay collected from API/offline
      const filteredByDelete = (moviesToDisplay || []).filter(
        m => !deletedIds.has(String(m.movieId))
      );

      const normalizedMovies = filteredByDelete.map(normalizeMovie).filter(Boolean);

      setLastRecommendedMovies(normalizedMovies.slice(0, 60));
      setAllShownTitles(new Set(normalizedMovies.map(m => m.title)));
      
    if (window.electron?.saveRecommendedMovies) {
        window.electron.saveRecommendedMovies(filteredByDelete); // save filtered
      }
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

      const newMovies = (response.data || [])
        .map(normalizeMovie)
        .filter(Boolean);


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
      let nextBatch = normalized.slice(start, start + 60);

      if (!nextBatch.length) {
        // go back to the start
        setRegenerateIndex(0);
        nextBatch = normalized.slice(0, 60);
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

//handle delete presisted set 
// --- Persisted "deleted" memory (per user) ---
const DELETED_KEY = `deleted_${savedUser?.userId || 'anon'}`;

const loadDeleted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY)) || []); }
  catch { return new Set(); }
};

const saveDeleted = (set) =>
  localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));

const [deletedIds, setDeletedIds] = useState(loadDeleted());
useEffect(() => { saveDeleted(deletedIds); }, [deletedIds]);

const handleAction = async (actionType, movieId) => {
    if (!movieId || !savedUser?.userId) return;

    const actions = {
      history: { url: "history", message: null },
      like: { url: "like", message: "Movie Liked!" },
      save: { url: "watchLater", message: "Saved to Watch Later!" },
      delete: { url: "recommended/delete", message: "Removed from recommendations" }
    };

    const action = actions[actionType];
    if (!action) return;

      if (!isOnline && actionType === "delete"){
        try {
    // 1) update UI immediately
    setMovies((prev) => prev.filter((m) => String(m.movieId) !== String(movieId)));
    setLastRecommendedMovies((prev) => prev.filter((m) => String(m.movieId) !== String(movieId)));

    // 2) update local recommended.json
    window.electron?.removeFromRecommended?.(movieId);

    // 3) queue for backend sync
    window.electron?.queueRecommendedAction?.({ type: "delete", movieId });

    // 4) toast
    setPopupMessage("Removed from recommendations (offline)");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  } catch (e) {
    console.warn("❌ Offline recommended delete failed:", e);
  }
  return; // stop here—no API call while offline
}

  
    // ---------- OFFLINE SAVE (early return) ----------
    if (!isOnline && actionType === "save") {
      try {
        // 1) queue for later sync
        window.electron?.queueSavedAction?.({ type: "add", movieId });
  
        // 2) build a rich object for the offline snapshot
        let full =
          lastRecommendedMovies.find(m => String(m.movieId) === String(movieId)) ||
          movies.find(m => String(m.movieId) === String(movieId)) ||
          null;
  
        // enrich from preload if missing poster/trailer
        if (!full || !full.poster_url || !full.trailer_url) {
          try {
            const pool = (await window.electron?.getRecommendedMovies?.()) || [];
            const found = pool.find(m => String(m.movieId) === String(movieId));
            if (found) full = { ...found, ...full };
          } catch {}
        }
  
        if (!full) {
          full = { movieId: String(movieId), title: `Movie #${movieId}`, poster_url: "" };
        }
  
        full = normalizeAndEnrich(full);
  
        // 3) write to offline snapshot if not already present
        if (window.electron?.getSavedSnapshot && window.electron?.saveSavedSnapshot) {
          const snap = window.electron.getSavedSnapshot() || [];
          const seen = new Set(snap.map(m => String(m.movieId ?? m._id)));
          if (!seen.has(String(movieId))) {
            window. electron. saveSavedSnapshot([ ... snap, full]);
          }
        }
  
        // 4) toast
        setPopupMessage("Saved to Watch Later! (offline)");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      } catch (e) {
        console.warn("❌ Offline save failed:", e);
      }
      return; // IMPORTANT: stop here in offline save
    }
  
    // ---------- Immediate UI update for delete ----------
    if (actionType === "delete") {
      setMovies(prev => prev.filter(m => m.movieId !== movieId));
      setLastRecommendedMovies(prev => prev.filter(m => m.movieId !== movieId));
      setLikedMovies(prev => prev.filter(m => m.movieId !== movieId));
      setSavedMovies(prev => prev.filter(m => m.movieId !== movieId));
      setWatchedMovies(prev => prev.filter(m => m.movieId !== movieId));

      // persist deletion
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.add(String(movieId));
        return next;
      });
  }
  
    // ---------- ONLINE / other actions ----------
    try {
      await axios.post(`${API}/api/movies/${action.url}`, {
        userId: savedUser.userId,
        movieId,
      });
  
      // mirror successful ONLINE save into snapshot for instant Watch Later UI
      if (actionType === "save") {
        let full =
          lastRecommendedMovies.find(m => String(m.movieId) === String(movieId)) ||
          movies.find(m => String(m.movieId) === String(movieId)) ||
          null;
  
        if (!full || !full.poster_url || !full.trailer_url) {
          try {
            const pool = (await window.electron?.getRecommendedMovies?.()) || [];
            const found = pool.find(m => String(m.movieId) === String(movieId));
            if (found) full = { ...found, ...full };
          } catch {}
        }
  
        if (full && window.electron?.getSavedSnapshot && window.electron?.saveSavedSnapshot) {
          full = normalizeAndEnrich(full);
          const snap = window.electron.getSavedSnapshot() || [];
          const seen = new Set(snap.map(m => String(m.movieId ?? m._id)));
          if (!seen.has(String(movieId))) {
            window.electron.saveSavedSnapshot([full, ...snap]);
          }
        }
      }
  
      // toast (online)
      setPopupMessage(action.message);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (err) {
      console.error(`❌ Error with action ${actionType}:`, err);
    }
  };


  const handleLike = async (movie) => {
      if (!movie || !savedUser?.userId) return;
  
      // ✅ normalize to keep genres/trailer_key/etc. consistent offline and online
      const normalized = normalizeMovie({ ...movie });
  
      if (!isOnline) {
        // 📴 Store the entire movie object locally for the Liked page
        // window.electron?.addMovieToLikedCache?.(normalized);
  
        // window.electron?.queueLiked?.({ type: "add", movie: normalized });
  
        // queue for future sync
        window.electron?.queueLiked?.({ type: "add", movie: normalized });
        console.log(
          "bridge:",
          !!window.electron,
          "addMovieToLikedList:",
          !!window.electron?.addMovieToLikedList,
          "queueLiked:",
          !!window.electron?.queueLiked
        );
  
        // snapshot so Liked page shows it immediately when offline/online
        window.electron?.addMovieToLikedList?.(normalized);
  
        setPopupMessage("Movie Liked! (offline)");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
        return; // no API call when offline
      }
  
      // 🌐 Online — send only IDs to API (backend will already store full movie object)
      try {
        await axios.post(`${API}/api/movies/like`, {
          userId: savedUser.userId,
          movieId: normalized,
        });
  
        window.electron?.addMovieToLikedList?.(normalized);
  
        setPopupMessage("Movie Liked!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
      } catch (err) {
        console.error("❌ Error with action like:", err);
      }
    };

      useEffect(() => {
        const syncRecommendedQueue = async () => {
          const queued = window.electron?.getRawRecommendedQueue?.() || [];
          if (!queued.length) return;
      
          for (const action of queued) {
            try {
              if (action?.type === "delete" && action.movieId) {
                await axios.post(`${API}/api/movies/recommended/delete`, {
                  userId: savedUser.userId,
                  movieId: action.movieId,
                });
              }
            } catch (err) {
              console.warn("❌ Failed to sync recommended delete:", err);
            }
          }
      
          window.electron?.clearRecommendedQueue?.();
          console.log("✅ Synced recommended queue");
        };
      
        if (isOnline && savedUser?.userId) {
          syncRecommendedQueue();
        }
      }, [isOnline, savedUser?.userId]);

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
    fetchSubscription(savedUser.userId);
  }
}, [savedUser?.userId, isOnline]);

   useEffect(() => {
  if (!savedUser?.userId) return;

    const fetchAllCarouselData = async () => {
      try {
        console.log("--- Starting Carousel Data Fetch ---");
        const seenIds = new Set();
        const setDefaultCounts = { liked: 0, saved: 0, watched: 0 };

        if (isOnline) {
          // 🌐 Online mode
          const [
            topLikedRes,
            likedTitlesRes,
            savedTitlesRes,
            watchedTitlesRes,
          ] = await Promise.all([
            axios.get(`${API}/api/movies/top-liked`),
            axios.get(`${API}/api/movies/likedMovies/${savedUser.userId}`),
            axios.get(`${API}/api/movies/watchLater/${savedUser.userId}`),
            axios.get(`${API}/api/movies/historyMovies/${savedUser.userId}`),
          ]);

          const topLiked = topLikedRes.data
            .map((m) => normalizeMovie(m.details))
            .filter(Boolean);
          const likedMoviesFull = likedTitlesRes.data?.likedMovies || [];
          const savedMoviesFull = savedTitlesRes.data?.SaveMovies || [];
          const watchedMoviesFull = watchedTitlesRes.data?.historyMovies || [];

          // Titles (just for carousel titles)
          const likedTitles = likedMoviesFull.slice(0, 2).map((m) => m.title);
          const savedTitles = savedMoviesFull.slice(0, 2).map((m) => m.title);
          const watchedTitles = watchedMoviesFull
            .slice(0, 2)
            .map((m) => m.title);

          // Set states
          setTopLikedMovies(topLiked);
          setLikedTitles(likedTitles);
          setSavedTitles(savedTitles);
          setWatchedTitles(watchedTitles);

          // Save lists to preload (for offline ALS use)
          window.electron?.saveCarouselData?.("topLiked", topLiked);
          window.electron?.saveCarouselData?.("likedTitles", likedTitles);
          window.electron?.saveCarouselData?.("savedTitles", savedTitles);
          window.electron?.saveCarouselData?.("watchedTitles", watchedTitles);

          // Counts
          const countsRes = await axios.get(
            `${API}/api/movies/counts/${savedUser.userId}`
          );
          const { liked, saved, watched } = countsRes.data;
          setInteractionCounts({ liked, saved, watched });
          window.electron?.saveCarouselData?.("interactionCounts", {
            liked,
            saved,
            watched,
          });

          // ALS fetch helper (returns movies)
          const fetchAndSetALS = async (key, count, endpoint, setter) => {
            if (count >= 5) {
              const res = await axios.post(endpoint, {
                userId: savedUser.userId,
                excludeIds: Array.from(seenIds),
              });
              const movies = res.data.map(normalizeMovie).filter(Boolean);
              setter(movies);
              movies.forEach((m) => seenIds.add(String(m.movieId)));
              window.electron?.saveCarouselData?.(key, movies);
              return movies;
            } else {
              setter([]);
              window.electron?.saveCarouselData?.(key, []);
              return [];
            }
          };

          // Save ALS movies
          await fetchAndSetALS(
            "alsLiked",
            liked,
            `${API}/api/movies/als-liked`,
            setLikedMovies
          );
          await fetchAndSetALS(
            "alsSaved",
            saved,
            `${API}/api/movies/als-saved`,
            setSavedMovies
          );
          await fetchAndSetALS(
            "alsWatched",
            watched,
            `${API}/api/movies/als-watched`,
            setWatchedMovies
          );
        } else {
          // 📴 Offline mode
          if (window.electron) {
            setTopLikedMovies(
              window.electron.getCarouselData?.("topLiked") || []
            );
            setLikedTitles(
              window.electron.getCarouselData?.("likedTitles") || []
            );
            setSavedTitles(
              window.electron.getCarouselData?.("savedTitles") || []
            );
            setWatchedTitles(
              window.electron.getCarouselData?.("watchedTitles") || []
            );
            setInteractionCounts(
              window.electron.getCarouselData?.("interactionCounts") ||
                setDefaultCounts
            );

            // Match keys saved in online mode (alsLiked, alsSaved, alsWatched)
            setLikedMovies(window.electron.getCarouselData?.("alsLiked") || []);
            setSavedMovies(window.electron.getCarouselData?.("alsSaved") || []);
            setWatchedMovies(
              window.electron.getCarouselData?.("alsWatched") || []
            );
          }
        }

        console.log("--- Carousel Data Fetch Complete ---");
      } catch (err) {
        console.error(
          "💥 A critical error occurred in fetchAllCarouselData:",
          err
        );
      }
    };

    fetchAllCarouselData();
  }, [savedUser?.userId, isOnline]);


  useEffect(() => {
    const trimmedQuery = searchQuery?.trim();
    if (!isSubscribed || !trimmedQuery) {
      setMovies(lastRecommendedMovies);
      return;
    }
    const debouncedFetch = debounce(async () => {
      try {
        const res = await axios.get(`${API}/api/movies/search`, {
          params: { q: trimmedQuery },
        });
        setMovies(
          (res.data || []).map(normalizeMovie).filter(Boolean).slice(0, 60)
        );
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

  console.log("OFFLINE DEBUG:", {
  isOnline,
  interactionCounts,
  likedMoviesLen: likedMovies.length,
  savedMoviesLen: savedMovies.length,
  watchedMoviesLen: watchedMovies.length,
  likedTitles,
  savedTitles,
  watchedTitles
});

useEffect(() => {
  const reloadFromDisk = async () => {
    const list = (await window.electron?.getRecommendedMovies?.()) || [];
    const normalized = list.map(normalizeMovie).filter(Boolean);
    setLastRecommendedMovies(normalized.slice(0, 60));
    setMovies(normalized.slice(0, 60));
  };

  const onUpdated = () => !navigator.onLine && reloadFromDisk();
  window.addEventListener("cineit:filterDataUpdated", onUpdated);
  return () => window.removeEventListener("cineit:filterDataUpdated", onUpdated);
}, []);

useEffect(() => {
  if (!isOnline) {
    (async () => {
      const list = (await window.electron?.getRecommendedMovies?.()) || [];
      const normalized = list.map(normalizeMovie).filter(Boolean);
      setLastRecommendedMovies(normalized.slice(0, 60));
      setMovies(normalized.slice(0, 60));
    })();
  }
}, [isOnline]);

// helper
const pickTop10 = (list=[]) =>
  [...list].sort((a,b)=>(b.predicted_rating||0)-(a.predicted_rating||0)).slice(0,10);


useEffect(() => {
  const loadOfflineTop10 = async () => {
    // 1) try cached top-10 file
    let top10 = await window.electron?.getTopRatedMovies?.();
    // 2) fallback: compute from recommended.json if top-10 file missing
    if (!top10 || top10.length === 0) {
      const recs = (await window.electron?.getRecommendedMovies?.()) || [];
      const normalized = recs.map(normalizeMovie).filter(Boolean);
      top10 = pickTop10(normalized);
    }
    // show only the same top-10 everywhere
    setLastRecommendedMovies(top10);
    setMovies(top10);
  };

  const onUpdated = () => { if (!navigator.onLine) loadOfflineTop10(); };

  window.addEventListener("cineit:filterDataUpdated", onUpdated);
  return () => window.removeEventListener("cineit:filterDataUpdated", onUpdated);
}, []);

useEffect(() => {
  if (!isOnline) {
    (async () => {
      // immediately switch to cached top 10
      const top10 = await window.electron?.getTopRatedMovies?.();
      if (top10?.length) {
        setLastRecommendedMovies(top10);
        setMovies(top10);
      } else {
        // fallback compute
        const recs = (await window.electron?.getRecommendedMovies?.()) || [];
        const normalized = recs.map(normalizeMovie).filter(Boolean);
        const picked = pickTop10(normalized);
        setLastRecommendedMovies(picked);
        setMovies(picked);
      }
    })();
  }
}, [isOnline]);

  // === RENDER ===
  return (
    <div className="sm:ml-64 pt-10 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* **CONDITIONAL LAYOUT SWITCH** */}
        {isSearching ? (
          // --- SEARCH RESULTS VIEW ---
          <div className="mt-15">
            <h2 className="text-2xl font-semibold text-black mb-4 px-4 dark:text-white">Search Results</h2>

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
                title={<span className="dark:text-white">🔥 Most Liked Movies </span>}
                movies={topLikedMovies}
                onMovieClick={(m) => setSelectedMovie({ ...m, __noDelete: true })}
                autoScroll={true} 
              />
              
              {/* These carousels will NOT auto-scroll because the prop is not passed (it defaults to false) */}
              {interactionCounts.liked >= 5 && likedMovies.length > 0 && (
                <MovieCarousel 
                  title={<span className="dark:text-white">Because you liked <span className="italic text-purple-500">{likedTitles.join(", ")}</span></span>}
                  movies={likedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}

              {interactionCounts.saved >= 5 && savedMovies.length > 0 && (
                <MovieCarousel
                  title={
                    <span className="dark:text-white">
                      Because you saved{" "}
                      <span className="italic text-green-500">
                        {savedTitles.join(", ")}
                      </span>
                    </span>
                  }
                  movies={savedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}

              
              {interactionCounts.watched >= 5 && watchedMovies.length > 0 && (
                <MovieCarousel
                  title={
                    <span className="dark:text-white">
                      Because you watched{" "}
                      <span className="italic text-orange-500">
                        {watchedTitles.join(", ")}
                      </span>
                    </span>
                  }
                  movies={watchedMovies}
                  onMovieClick={setSelectedMovie}
                />
              )}
            </div>

            {/* Main Recommendations Grid */}
            <div className="flex justify-between items-center mb-4 px-4">
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                Recommended for You
              </h2>

              <div className="relative inline-block group">
                <button
                  onClick={handleRegenerate}
                  disabled={!isSubscribed || isLoading}
                  className="relative z-10 font-medium border border-gray-400 px-6 py-2 rounded-lg text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200 transition-transform active:scale-95"
                >
                  Regenerate
                </button>

                {!isSubscribed && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-max whitespace-nowrap bg-black text-white text-xs rounded py-1 px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
                  >
                    Subscribe to unlock this feature
                  </div>
                )}
              </div>
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
        )}
      </div>

      {/* --- MODAL & OVERLAYS (Unaffected by the layout switch) --- */}
      <MovieModal
        isOpen={!!selectedMovie}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        isSubscribed={isSubscribed}
        isOnline={isOnline}
        onPlay={handleHistory}
        onLike={(movie) => handleLike(movie)}
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