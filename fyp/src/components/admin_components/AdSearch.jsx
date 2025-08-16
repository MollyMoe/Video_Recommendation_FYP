
import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes, FaBackspace } from "react-icons/fa";

const AdSearch = ({ onSearch, userId }) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const storageKey = userId ? `searchHistory_filter_${userId}` : "searchHistory_filter_default";

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
    const exists = history.some((h) => h.toLowerCase() === normalizedTerm);
    if (!exists) {
      const updatedHistory = [term, ...history].slice(0, 10); // Limit to 10
      setHistory(updatedHistory);
    }
  };

  const executeSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      addToHistory(trimmed); // Use the addToHistory function here
      onSearch(trimmed);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };

  const handleHistoryClick = (term) => {
    setInputValue(term);
    onSearch(term);
    setIsFocused(false);
  };

  const handleRemoveHistory = (item, e) => {
    e.stopPropagation();
    const updatedHistory = history.filter((term) => term !== item);
    setHistory(updatedHistory);
  };

  const handleClear = () => {
    setInputValue("");
    onSearch("");
  };

  return (
    <div className="flex-1 px-5 hidden md:flex justify-center" ref={wrapperRef}>
      <div className="relative w-full max-w-md z-50">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for movies..."
          className="w-full pl-4 pr-20 py-2 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search input"
          >
            <FaTimes />
          </button>
        )}

        <button
          type="button"
          onClick={executeSearch}
          className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
          aria-label="Submit search"
        >
          <FaSearch />
        </button>

        {isFocused && history.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
            <p className="px-4 py-2 text-xs text-gray-500">Search History</p>
            {history.map((item) => (
              <div
                key={item}
                onClick={() => handleHistoryClick(item)}
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <span>{item}</span>
                <button
                  onClick={(e) => handleRemoveHistory(item, e)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={`Remove ${item} from history`}
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

export default AdSearch;
