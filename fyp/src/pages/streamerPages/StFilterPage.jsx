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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;

  // ✅ Safe normalizer
  const normalizeString = (value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase();
    if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
    return "";
  };

  // ✅ Listen for online/offline changes
  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  // ✅ Fetch and prepare movies
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        let subData, likedData, recommendedData;

        if (isOnline) {
          const [subRes, likedRes, recommendedRes] = await Promise.all([
            fetch(`${API}/api/subscription/${userId}`),
            fetch(`${API}/api/movies/top-liked`),
            fetch(`${API}/api/movies/recommendations/${userId}`)
          ]);
          subData = await subRes.json();
          likedData = await likedRes.json();
          recommendedData = await recommendedRes.json();

          if (window.electron?.saveSubscription) {
            await window.electron.saveSubscription(subData);
            await window.electron.saveLikedData(likedData);
            await window.electron.saveRecommendedMovies(recommendedData);
            console.log("✅ Online data cached");
          }
        } else {
          subData = await window.electron.getSubscription(userId);
          likedData = await window.electron.getLikedData();
          recommendedData = await window.electron.getRecommendedMovies();
          console.log("✅ Offline data loaded");
        }

        const likedMovieIds = likedData.map(item => String(item.movieId));
        if (!Array.isArray(recommendedData)) recommendedData = [];

        const processedMovies = recommendedData.map((movie) => {
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
          };
        });

        const inLiked = [], notInLiked = [];
        for (const movie of processedMovies) {
          if (likedMovieIds.includes(String(movie.movieId))) {
            inLiked.push(movie);
          } else {
            notInLiked.push(movie);
          }
        }

        const sortedInLiked = inLiked.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));
        const sortedNotInLiked = notInLiked.sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0));
        const finalList = [...sortedInLiked, ...sortedNotInLiked];

        setIsSubscribed(subData?.isActive || false);
        setAllMovies(finalList);
        setMovies(finalList);
      } catch (err) {
        console.error("❌ Failed to fetch data:", err);
        setIsSubscribed(false);
        setMovies([]);
        setAllMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [userId, isOnline]);

  // ✅ Shared search logic (used in fallback)
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
            isOnline={isOnline}
            onSearch={(result) => {
              if (Array.isArray(result)) {
                // Offline mode passed in filtered movies
                setMovies(result);
                setIsSearching(false);
                setSubmittedQuery(searchQuery);
              } else {
                // Online mode fallback: filter client-side
                handleSearch(result);
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
        />
      </div>
    </>
  );
};

export default StFilterPage;