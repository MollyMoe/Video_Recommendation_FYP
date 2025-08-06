import { useState, useRef, useEffect } from "react";
import { FaSearch, FaBackspace } from "react-icons/fa";

const AdSearch = ({ searchQuery, setSearchQuery, onSearch }) => {
  const [history, setHistory] = useState([]);
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      if (!history.includes(trimmed)) {
        setHistory([trimmed, ...history]);
      }
      onSearch(trimmed);
    }
  };

  const handleHistoryClick = (term) => {
    setSearchQuery(term);
    onSearch(term);
    setIsFocused(false);
  };

  const handleRemove = (item, e) => {
    e.stopPropagation();
    setHistory(history.filter((term) => term !== item));
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
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = searchQuery.trim();
            if (trimmed) {
              if (!history.includes(trimmed)) {
                setHistory([trimmed, ...history]);
              }
              onSearch(trimmed);
              setIsFocused(false);
            }
          }}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
        >
          <FaSearch />
        </button>

        {isFocused && history.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-md">
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

export default AdSearch;