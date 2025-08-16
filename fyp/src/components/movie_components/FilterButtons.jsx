
import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

// Reusable button for the sort options
const SortButton = ({ children, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border rounded-full transition-colors ${
      isActive
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

function FilterButtons({ allGenres, onFilterAndSort, onClear, currentSort, currentGenres }) {
  const [showGenres, setShowGenres] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState(new Set(currentGenres));

  useEffect(() => {
    setSelectedGenres(new Set(currentGenres));
  }, [currentGenres]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    // We call the unified handler with a `genres` payload
    onFilterAndSort({ genres: Array.from(selectedGenres) });
    setShowGenres(false);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-gray-600 mr-2">Sort by:</span>
      
      {/* We now call `onFilterAndSort` with a `sort` payload for each button. */}
      <SortButton onClick={() => onFilterAndSort({ sort: 'year_desc' })} isActive={currentSort === 'year_desc'}>
        Newest First
      </SortButton>
      <SortButton onClick={() => onFilterAndSort({ sort: 'year_asc' })} isActive={currentSort === 'year_asc'}>
        Oldest First
      </SortButton>

      {/* --- Multi-Select Genre Filter Dropdown --- */}
      <div className="relative ml-4">
        <button
          onClick={() => setShowGenres(!showGenres)}
          className={`px-4 py-2 text-sm font-medium border rounded-full flex items-center transition-colors ${
            currentGenres.length > 0
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {currentGenres.length > 0 ? `${currentGenres.length} Genre(s) Selected` : 'Filter by Genre'}
          <ChevronDown size={16} className={`ml-2 transition-transform ${showGenres ? 'rotate-180' : ''}`} />
        </button>
        
        {showGenres && (
          <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="max-h-60 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-2">
                {allGenres.map(genre => (
                  <label key={genre} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-purple-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.has(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">{genre}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={handleApply}
                className="w-full bg-purple-600 text-white font-semibold py-2 rounded-md hover:bg-purple-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Clear Button --- */}
      <button
        onClick={onClear}
        className="p-2 text-gray-500 hover:text-gray-800 ml-auto flex items-center gap-1 text-sm"
        title="Clear filters and sorting"
      >
        <X size={16} />
        Clear
      </button>
    </div>
  );
}


export default FilterButtons;

