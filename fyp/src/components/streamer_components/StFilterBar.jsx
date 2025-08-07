import { useState, useRef, useEffect } from "react";
import { FaSearch, FaBackspace, FaTimes } from "react-icons/fa";

const StFilterBar = ({ searchQuery, setSearchQuery, onSearch, isOnline }) => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId || "default";
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const storageKey = `searchHistory_${userId}`;

  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, storageKey]);

  const addToHistory = (term) => {
    const normalizedTerm = term.toLowerCase();
    if (!history.some((h) => h.toLowerCase() === normalizedTerm)) {
      setHistory([term, ...history.slice(0, 9)]);
    }
  };

  const filterOffline = async (term) => {
  const queryLower = term.toLowerCase();

  const normalizeString = (value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase();
    if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
    return "";
  };

  const processMovie = (movie) => {
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
  };

  try {
    const recommended = await window.electron.getRecommendedMovies();
    const filtered = recommended
      .filter((movie) => {
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
      })
      .map(processMovie); // ✅ ensure all results are shaped correctly

    onSearch(filtered);
  } catch (err) {
    console.error("❌ Offline search failed:", err);
    onSearch([]);
  }
};


  const handleSubmitSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    addToHistory(trimmed);
    setIsFocused(false);

    if (isOnline) {
      onSearch(trimmed); // online: send query string
    } else {
      await filterOffline(trimmed); // offline: local filtering
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      await handleSubmitSearch();
    }
  };

  const handleHistoryClick = async (term) => {
    setSearchQuery(term);
    setIsFocused(false);
    if (isOnline) {
      onSearch(term);
    } else {
      await filterOffline(term);
    }
  };

  const handleRemove = (item, e) => {
    e.stopPropagation();
    setHistory(history.filter((term) => term !== item));
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className="w-full flex flex-col items-center px-4 mt-8">
      <h1 className="text-xl font-bold text-gray-700 mb-3 text-center dark:text-white">
        What would you like to watch?
      </h1>

      <div className="relative w-full max-w-sm" ref={wrapperRef}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full pl-4 pr-10 py-2 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search movies"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search input"
          >
            <FaTimes />
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmitSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label="Submit search"
        >
          <FaSearch />
        </button>

        {isFocused && history.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-20">
            {history.map((item) => (
              <div
                key={item}
                onClick={() => handleHistoryClick(item)}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <span>{item}</span>
                <button
                  onClick={(e) => handleRemove(item, e)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaBackspace />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StFilterBar;