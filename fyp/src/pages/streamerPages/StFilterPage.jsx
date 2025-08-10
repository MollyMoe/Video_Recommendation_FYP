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
    try {
      if (isOnline) {
        // ✅ ONLINE MODE: fetch truth from API
        const [subRes, recommendedRes] = await Promise.all([
          fetch(`${API}/api/subscription/${userId}`),
          fetch(`${API}/api/movies/recommendations/${userId}`)
        ]);

        const subData = await subRes.json();
        let recommendedData = await recommendedRes.json();
        if (!Array.isArray(recommendedData)) recommendedData = [];

        // Cache subscription in localStorage for offline use
        localStorage.setItem(
          "sub-cache",
          JSON.stringify({
            userId,
            isActive: !!subData?.isActive,
            cachedAt: Date.now()
          })
        );

        // Save subscription & movies in Electron cache
        if (window.electron?.saveSubscription) {
          await window.electron.saveSubscription(subData);
          await window.electron.saveRecommendedMovies(recommendedData);
        }

        // Process & set movie lists
        const processed = recommendedData
          .filter(m => m.poster_url && m.trailer_url)
          .map((movie) => {
            const url = movie.trailer_url || "";
            let trailer_key = null;
            if (url.includes("v=")) trailer_key = url.split("v=")[1].split("&")[0];
            else if (url.includes("youtu.be/")) trailer_key = url.split("youtu.be/")[1].split("?")[0];
            return {
              ...movie,
              trailer_key,
              genres: normalizeString(movie.genres),
              producers: normalizeString(movie.producers),
              actors: normalizeString(movie.actors),
              director: normalizeString(movie.director),
            };
          });

        const top10 = processed
          .slice()
          .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
          .slice(0, 10);

        setAllMovies(processed);
        setMovies(processed);
        setTopRated(top10);

        if (window.electron?.saveTopRatedMovies) {
          await window.electron.saveTopRatedMovies(top10);
        }

        // ✅ Set subscription from online truth
        setIsSubscribed(!!subData?.isActive);

      } else {
        // 📴 OFFLINE MODE: use only cached subscription status
        const subCacheRaw = localStorage.getItem("sub-cache");
        const subCache = subCacheRaw ? JSON.parse(subCacheRaw) : null;

        const within7Days =
          subCache?.cachedAt &&
          (Date.now() - subCache.cachedAt) < 7 * 24 * 60 * 60 * 1000;

        const lsActive =
          !!subCache?.isActive &&
          subCache?.userId === userId &&
          within7Days;

        let electronActive = false;
        try {
          const subFromElectron = await window.electron?.getSubscription?.(userId);
          electronActive = !!subFromElectron?.isActive;
        } catch {}

        setIsSubscribed(lsActive || electronActive);

        // Load offline movie lists
        const cachedRecs = await window.electron?.getRecommendedMovies?.();
        const topCached = await window.electron?.getTopRatedMovies?.();

        const processed = (cachedRecs || [])
          .filter(m => m.poster_url && m.trailer_url)
          .map((movie) => {
            const url = movie.trailer_url || "";
            let trailer_key = null;
            if (url.includes("v=")) trailer_key = url.split("v=")[1].split("&")[0];
            else if (url.includes("youtu.be/")) trailer_key = url.split("youtu.be/")[1].split("?")[0];
            return {
              ...movie,
              trailer_key,
              genres: normalizeString(movie.genres),
              producers: normalizeString(movie.producers),
              actors: normalizeString(movie.actors),
              director: normalizeString(movie.director),
            };
          });

        setAllMovies(processed);
        setMovies(processed);
        setTopRated(topCached || []);
      }
    } catch (err) {
      console.error("❌ Failed to load recommended data:", err);
      setIsSubscribed(false);
      setMovies([]);
      setAllMovies([]);
      setTopRated([]);
    } finally {
      setIsLoading(false);
    }
  };



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
            <p className="text-lg font-semibold">Loading Movies...</p>
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

      <div className="fixed top-[80px] left-20 w-full h-35 flex justify-center px-4 z-30 bg-white dark:bg-gray-800">
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
          isOnline= {isOnline}
          isSearching={isSearching}
          setMovies={setMovies}
          topRated={topRated} // 🔥 Use this in StFilterContent if needed
        />
      </div>
    </>
  );
};

export default StFilterPage;