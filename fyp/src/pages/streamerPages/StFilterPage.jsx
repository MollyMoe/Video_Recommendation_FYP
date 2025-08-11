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

  const normalizeString = (value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase();
    if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
    return "";
  };

  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  const processList = (list = []) =>
    (list || [])
      .filter(m => m?.poster_url && m?.trailer_url)
      .map((movie) => {
        const url = movie.trailer_url || "";
        let trailer_key = null;
        if (url.includes("v=")) trailer_key = url.split("v=")[1].split("&")[0];
        else if (url.includes("youtu.be/")) trailer_key = url.split("youtu.be/")[1].split("?")[0];

        return {
          ...movie,
          trailer_key,
          genres:    normalizeString(movie.genres),
          producers: normalizeString(movie.producers),
          actors:    normalizeString(movie.actors),
          director:  normalizeString(movie.director),
        };
      });

  const computeTop10 = (processed) =>
    processed.slice()
      .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
      .slice(0, 10);

  // warm cache read
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await Promise.resolve(window.electron?.getRecommendedMovies?.() ?? []);
        if (cancelled) return;
        const processed = processList(cached);
        if (processed.length) {
          setMovies(processed);
          setAllMovies(processed);
        }
        const topCached = await Promise.resolve(window.electron?.getTopRatedMovies?.() ?? []);
        if (!cancelled) setTopRated(Array.isArray(topCached) ? topCached : []);
      } catch (e) {
        console.warn("Cache read failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // authoritative load
  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    let cancelled = false;
    const runId = Math.random();
    let activeRun = runId;

    (async () => {
      try {
        let subData = null;
        let recommendedData = [];

        if (isOnline) {
          const [subRes, recommendedRes] = await Promise.all([
            fetch(`${API}/api/subscription/${userId}`),
            fetch(`${API}/api/movies/recommendations/${userId}`)
          ]);
          subData = await subRes.json();
          recommendedData = await recommendedRes.json();
          if (!Array.isArray(recommendedData)) recommendedData = [];
          const processed = processList(recommendedData);
          const top10 = computeTop10(processed);

          if (!cancelled && activeRun === runId) {
            setAllMovies(processed);
            setMovies(processed);
            setTopRated(top10);
          }

          try {
            await window.electron?.saveSubscription?.(subData);
            await window.electron?.saveRecommendedMovies?.(processed);
            await window.electron?.saveTopRatedMovies?.(top10);
          } catch (e) {
            console.warn("Offline save failed:", e);
          }
        } else {
          try { subData = await Promise.resolve(window.electron?.getSubscription?.(userId)); } catch {}
          const cached = await Promise.resolve(window.electron?.getRecommendedMovies?.() ?? []);
          const topCached = await Promise.resolve(window.electron?.getTopRatedMovies?.() ?? []);
          const processed = processList(cached);
          if (!cancelled && activeRun === runId) {
            setAllMovies(processed);
            setMovies(processed);
            setTopRated(Array.isArray(topCached) ? topCached : computeTop10(processed));
          }
        }

        if (!cancelled && activeRun === runId) {
          setIsSubscribed(!!subData?.isActive);
        }
      } catch (err) {
        console.error("❌ Failed to load recommended data:", err);
        if (!cancelled && activeRun === runId) {
          setIsSubscribed(false);
          setMovies([]); setAllMovies([]); setTopRated([]);
        }
      } finally {
        if (!cancelled && activeRun === runId) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; activeRun = null; };
  }, [userId, isOnline, API]);

  // 🔴 Parent-owned delete: update UI + cache + (if online) server
  const onDeleteMovie = async (movieId) => {
    const id = String(movieId);

    // 1) Update UI immediately
    setMovies(prev => prev.filter(m => String(m.movieId) !== id));
    setAllMovies(prev => prev.filter(m => String(m.movieId) !== id));
    setTopRated(prev => prev.filter(m => String(m.movieId) !== id));

    // 2) Persist offline snapshot
    try {
      const next = (await Promise.resolve(window.electron?.getRecommendedMovies?.())) || [];
      const filtered = next.filter(m => String(m.movieId) !== id);
      await window.electron?.saveRecommendedMovies?.(filtered);
      await window.electron?.removeFromRecommended?.(id);
    } catch {}

    // 3) Server delete (best-effort)
    if (isOnline && userId) {
      try {
        await fetch(`${API}/api/movies/recommended/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, movieId: id }),
        });
      } catch (e) {
        console.warn("Server delete failed; will rely on snapshot/queue:", e);
        try { window.electron?.queueRecommendedAction?.({ type: "delete", movieId: id }); } catch {}
      }
    } else {
      try { window.electron?.queueRecommendedAction?.({ type: "delete", movieId: id }); } catch {}
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSubmittedQuery(query);

    if (!query.trim()) { setMovies(allMovies); setIsSearching(false); return; }

    setIsSearching(true);
    const q = query.toLowerCase();
    const norm = (v) => Array.isArray(v) ? v.join(" ").toLowerCase() :
                      typeof v === "string" ? v.replace(/[|,]/g, " ").toLowerCase() : "";

    const filtered = allMovies.filter((m) =>
      (m.title || "").toLowerCase().includes(q) ||
      norm(m.director).includes(q) ||
      norm(m.producers).includes(q) ||
      norm(m.genres).includes(q) ||
      norm(m.actors).includes(q)
    );

    setMovies(filtered);
    setIsSearching(false);
  };

  if (isLoading) {
    return (
      <>
        <StNav /><StSideBar />
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
        <StNav /><StSideBar />
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
              if (Array.isArray(result)) { setMovies(result); setIsSearching(false); }
              else { handleSearch(result); setSubmittedQuery(result); }
            }}
          />
        </div>
      </div>

      <div className="sm:ml-64 px-4">
        <StFilterContent
          submittedQuery={submittedQuery}
          movies={movies}
          isLoading={isLoading}
          isOnline={isOnline}
          isSearching={isSearching}
          setMovies={setMovies}
          onDeleteMovie={onDeleteMovie}  // ← pass down
          topRated={topRated}
        />
      </div>
    </>
  );
};

export default StFilterPage;