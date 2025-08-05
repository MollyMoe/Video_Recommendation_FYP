import React, { useEffect, useState } from "react";
import axios from "axios";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StFilterContent from "../../components/streamer_components/StFilterContent";
import StFilterBar from "../../components/streamer_components/StFilterBar";

const API = import.meta.env.VITE_API_BASE_URL;

const StFilterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [allMovies, setAllMovies] = useState([]); // Master list of all movies
  const [movies, setMovies] = useState([]);       // List of movies to display
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSearching, setIsSearching] = useState(false);


  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [subRes, likedRes, recommendedRes] = await Promise.all([
          fetch(`${API}/api/subscription/${userId}`),
          axios.get(`${API}/api/movies/top-liked`),
          axios.get(`${API}/api/movies/recommendations/${userId}`)
        ]);

        const subData = await subRes.json();
        setIsSubscribed(subData.isActive);
        if (!subData.isActive) {
          return;
        }

        const likedMovieIds = likedRes.data.map(item => String(item.movieId));
        let recommendedMovies = recommendedRes.data;
        if (!Array.isArray(recommendedMovies)) recommendedMovies = [];

        const processedMovies = recommendedMovies.map(movie => {
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
                genres: typeof movie.genres === 'string' ? movie.genres.replace(/\|/g, ", ") : "",
                producers: typeof movie.producers === 'string' ? movie.producers.replace(/\|/g, ", ") : "",
                actors: movie.actors || "",
            };
        });

        const inLiked = [];
        const notInLiked = [];
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
        
        setAllMovies(finalList);
        setMovies(finalList);
      } catch (err) {
        console.error("❌ Failed to fetch initial data:", err);
        setMovies([]);
        setAllMovies([]);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [userId]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSubmittedQuery(query);

    if (!query.trim()) {
      setMovies(allMovies); // Reset to show Top 10 view
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const queryLower = query.toLowerCase();
      const normalizeString = (str) => (str || "").replace(/[|,]/g, " ").toLowerCase();

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
    }, 300);
  };

  if (isLoading) {
    return (
      <>
        <StNav />
        <StSideBar />
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading Movie</p>
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
            onSearch={handleSearch}
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