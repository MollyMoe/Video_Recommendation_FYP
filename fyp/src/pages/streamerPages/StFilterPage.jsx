import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StFilterContent from "../../components/streamer_components/StFilterContent";
import StFilterBar from "../../components/streamer_components/StFilterBar";
import { API } from "@/config/api";

const StFilterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [allMovies, setAllMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;

  const DELETED_KEY = `deleted_${userId || 'anon'}`;

  // Helper function to load the Set of deleted IDs from localStorage.
  const loadDeleted = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(DELETED_KEY)) || []);
    } catch {
      return new Set();
    }
  };
  
  // ✅ Normalize helper
  const normalizeString = (value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase();
    if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
    return "";
  };

  // ✅ Handle online/offline state
  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  // ✅ Load everything (recommended + topRated)
  const loadRecommendedMovies = async () => {
    setIsLoading(true);
    const deletedIds = loadDeleted(); 
    try {
      // --- 1) Resolve subscription first (online -> offline fallback, owner-checked) ---
      if (isOnline) {
        try {
          const subRes = await fetch(`${API}/api/subscription/${userId}`);
          if (subRes.ok) {
            const sub = await subRes.json();
            setIsSubscribed(Boolean(sub?.isActive));
            window.electron?.saveSubscription?.(sub);
          } else {
            const offlineSub = await window.electron?.getSubscription?.();
            const usable = offlineSub?.userId === userId ? offlineSub : null;
            setIsSubscribed(Boolean(usable?.isActive));
          }
        } catch {
          const offlineSub = await window.electron?.getSubscription?.();
          const usable = offlineSub?.userId === userId ? offlineSub : null;
          setIsSubscribed(Boolean(usable?.isActive));
        }
      } else {
        const offlineSub = await window.electron?.getSubscription?.();
        const usable = offlineSub?.userId === userId ? offlineSub : null;
        setIsSubscribed(Boolean(usable?.isActive));
      }

      // --- 2) Load recommendations/topRated from cache, fallback to API if empty ---
      let recs = (await window.electron?.getRecommendedMovies?.()) || [];
      let top  = (await window.electron?.getTopRatedMovies?.()) || [];

      if ((!recs.length || !top.length) && isOnline) {
        const recRes = await fetch(`${API}/api/movies/recommendations/${userId}`);
        const data = await recRes.json();
        recs = Array.isArray(data) ? data : [];
        await window.electron?.replaceRecommendedMovies?.(recs);
        await window.electron?.saveTopRatedMovies?.(
          recs.slice().sort((a,b)=>(b.predicted_rating||0)-(a.predicted_rating||0)).slice(0,10)
        );
        top = (await window.electron?.getTopRatedMovies?.()) || [];
      }

      const filteredRecs = recs.filter(m => !deletedIds.has(String(m.movieId)));
      const filteredTop = top.filter(m => !deletedIds.has(String(m.movieId)));

      // --- 3) Normalize just like Home ---
      const norm = (m) => {
        const mm = { ...m };
        if (typeof mm.genres === "string") {
          mm.genres = mm.genres.split(/[,|]/).map(s => s.trim());
        }
        const match = mm.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        mm.trailer_key = match ? match[1] : (mm.trailer_key ?? null);
        mm.predicted_rating = Number.isFinite(+mm.predicted_rating) ? +mm.predicted_rating : 0;
        return mm;
      };

      const processed = filteredRecs.map(norm);
      setMovies(processed);
      setAllMovies(processed);
      setTopRated(filteredTop.map(norm));

      // ✅ DO NOT overwrite isSubscribed here with a stale cache again
    } catch (e) {
      console.error("loadRecommendedMovies failed:", e);
      setMovies([]);
      setAllMovies([]);
      setTopRated([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const reload = () => loadRecommendedMovies();
    window.addEventListener("cineit:recommendationsUpdated", reload);
    return () => window.removeEventListener("cineit:recommendationsUpdated", reload);
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "recs_version") loadRecommendedMovies();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    loadRecommendedMovies();
  }, [userId, isOnline]);

  // ✅ Search logic
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSubmittedQuery(query);

    if (!query.trim()) {
      setMovies(allMovies);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const queryLower = query.toLowerCase();

    const filteredList = allMovies.filter((movie) => {
      const title = (movie.title || "").toLowerCase();
      const director = normalizeString(movie.director);
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

    setMovies(filteredList);
    setIsSearching(false);
  };

  if (isLoading) {
    return (
      <>
        <StNav />
        <StSideBar />
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold text-gray-900">Loading Movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <StNav />
        <StSideBar />
        <div className="sm:ml-64 flex items-center justify-center h-screen dark:bg-gray-900 text-center px-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">🔒 This feature is locked</h2>
            <p className="text-gray-600 dark:text-gray-300">Please subscribe to unlock the advanced filtering feature.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StNav />
      <StSideBar />

      <div className="fixed top-[80px] left-20 w-full h-35 flex justify-center px-4 z-30 bg-white dark:bg-gray-900">
        <div className="w-full max-w-sm flex flex-col justify-center">
          <StFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSubmittedQuery={setSubmittedQuery} 
            isOnline={isOnline}
            onSearch={(result) => {
              if (Array.isArray(result)) {
                setMovies(result);
                setIsSearching(false);
              } else {
                handleSearch(result);
                setSubmittedQuery(result); 
              }
            }}
          />
        </div>
      </div>

      <div className="sm:ml-64 px-4">
        <StFilterContent
          submittedQuery={submittedQuery}
          movies={movies}
          isLoading={isLoading}
          isSearching={isSearching}
          setMovies={setMovies}
          topRated={topRated} // 🔥 Use this in StFilterContent if needed
        />
      </div>
    </>
  );
};

export default StFilterPage;