import { useState, useRef, useEffect } from "react";
import { FaSearch, FaBackspace, FaTimes } from "react-icons/fa";

const StSearchBar = ({ searchQuery, setSearchQuery, onSearch }) => {
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem("searchHistory");
    return stored ? JSON.parse(stored) : [];
  });
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);

  const handleClickOutside = (event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }, [history]);

  const addToHistory = (term) => {
    const normalizedTerm = term.toLowerCase();
    const exists = history.some((h) => h.toLowerCase() === normalizedTerm);
    if (!exists) {
      setHistory([term, ...history.slice(0, 9)]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault(); // Prevent form submission or unwanted side effects
      const trimmed = searchQuery.trim();
      addToHistory(trimmed);
      onSearch(trimmed);
      setIsFocused(false);
    }
  };

  const handleHistoryClick = (term) => {
    setSearchQuery(term);
    onSearch(term);
    setIsFocused(false);
  };

  const handleRemove = (item, e) => {
    e.stopPropagation();
    const updated = history.filter((term) => term !== item);
    setHistory(updated);
  };

  return (
    <div className="flex-1 px-5 hidden md:flex justify-center" ref={wrapperRef}>
      <div className="relative w-full max-w-md z-60">
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
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-10 flex items-center text-gray-500 hover:text-gray-700 px-2"
            aria-label="Clear search input"
          >
            <FaTimes />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const trimmed = searchQuery.trim();
            if (trimmed) {
              addToHistory(trimmed);
              onSearch(trimmed);
              setIsFocused(false);
            }
          }}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
          aria-label="Submit search"
        >
          <FaSearch />
        </button>

        {isFocused && history.length > 0 && (
          <div
            className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-md max-h-60 overflow-auto"
            role="listbox"
            aria-label="Search history"
          >
            {history.map((item) => (
              <div
                key={item}
                onClick={() => handleHistoryClick(item)}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                role="option"
                tabIndex={0}
              >
                <span>{item}</span>
                <button
                  onClick={(e) => handleRemove(item, e)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={`Remove ${item} from search history`}
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

export default StSearchBar;