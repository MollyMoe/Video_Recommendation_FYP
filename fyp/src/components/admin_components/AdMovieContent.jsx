import React, { useEffect, useState, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';

import { getAPI } from "@/config/api";

const API = getAPI();

const AdMovieContent = ({ searchQuery, externalUpdateTrigger, setRecentMoviesGlobal, currentRecentMoviesGlobal }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [movies, setMovies] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({});

  const [syncStatus, setSyncStatus] = useState({
      stage: 'idle',
      message: ''
    });

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/movies/limit`, {
        params: { page, limit: 20, search: searchQuery || "" },
      });

      if (!res.data || !res.data.data) {
        console.warn("API response data is invalid. Skipping movie data processing.");
        setMovies([]);
        setTotalPages(1);
        return;
      }

      const newMoviesData = res.data.data;
      const total = res.data.total;

      setMovies(newMoviesData); 
      setTotalPages(Math.ceil(total / 20));

    } catch (err) {
      console.error('❌ Failed to fetch movies', err);
      setMovies([]); 
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); 
  }, [searchQuery]);

  useEffect(() => {
    fetchMovies();
  }, [page, searchQuery, externalUpdateTrigger]);


  const handleDelete = async (id) => {
    
    setSyncStatus({ stage: 'deleting', message: '' });
    try {
    const response = await axios.post(`${API}/api/movies/delete`, { 
        movieId: id 
      });
      
      setMovies((prev) => prev.filter((movie) => movie.movieId !== id));
      setRecentMoviesGlobal((prev) => prev.filter((movie) => movie.movieId !== id));
      
      setTimeout(() => {
        setSyncStatus({
          stage: 'finished',
          message: response.data.message || "Movie deleted successfully."
        });
      }, 2000);

    } catch (error) {
      console.error("Error deleting movie:", error);
      setTimeout(() => {
        setSyncStatus({
          stage: 'finished',
          message: "Failed to delete movie: " + (error.response?.data?.detail || error.message || "An error occurred.")
        });
      }, 2000);
    }
  };

  const closeSyncModal = () => {
    setSyncStatus({ stage: 'idle', message: '' });
  };

  const openConfirm = (id) => {
    setSelectedMovieId(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMovieId) {
      handleDelete(selectedMovieId);
    }
    setIsConfirmOpen(false);
    setSelectedMovieId(null);
  };

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setSelectedMovieId(null);
  };

  const handleMouseEnter = (movieId, e) => {
    setHoveredMovieId(movieId);
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 224; 
    const spaceRight = window.innerWidth - rect.right;

    if (spaceRight < tooltipWidth) {
      setTooltipPosition({ [movieId]: 'left' });
    } else {
      setTooltipPosition({ [movieId]: 'right' });
    }
  };

  const handleMouseLeave = () => {
    setHoveredMovieId(null);
    setTooltipPosition({});
  };

  if (isLoading && movies.length === 0) {
    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Loading Movies...</p>
          <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="sm:ml-0 px-4 sm:px-8 dark:border-gray-700 mr-10"> 
    {/* change the mr */}
      {/* 🎬 All Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
        {movies.map((movie) => {
          const isNewlyAdded = currentRecentMoviesGlobal && currentRecentMoviesGlobal.some(recent => recent._id === movie._id);

          return (
            <div
              key={movie._id}
              className={`relative w-[140px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-visible flex flex-col items-center`}
              onMouseEnter={(e) => handleMouseEnter(movie._id, e)}
              onMouseLeave={handleMouseLeave}
            >
              {isNewlyAdded && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-md">
                  Newly Added!
                </div>
              )}

              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full aspect-[9/16] object-cover"
              />
              <div className="w-full p-2 flex justify-center">
                <button
                  onClick={() => openConfirm(movie.movieId)}
                  
                  className="w-full flex justify-center items-center space-x-2 text-gray-800 py-2 rounded-xl hover:bg-gray-100 dark:text-white dark:hover:bg-gray-500"
                >
                  <FaTrash />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
              
              {/* Tooltip-like details box, conditionally displayed on hover */}
              {hoveredMovieId === movie._id && (
                <div
                  className={`absolute top-0 ${
                    tooltipPosition[movie._id] === 'left'
                      ? 'right-full mr-4'
                      : 'left-full ml-4'
                  } w-56 p-3 bg-white dark:bg-gray-700 shadow-lg z-50 text-black dark:text-white`}
                >
                  <h3 className="font-semibold text-sm mb-1">{movie.title}</h3>
                  <p className="text-sm mb-1">Director: {movie.director || 'Unknown'}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center mt-15 mb-5 space-x-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-2 py-1 rounded-md font-medium transition-all duration-200 ${
            page === 1
              ? "text-gray-500 bg-gray-300 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-md shadow text-black dark:text-white font-semibold text-sm tracking-wide">
          <span>Page</span>
          <span className="text-purple-600 dark:text-purple-400">{page}</span>
          <span>/</span>
          <span>{totalPages}</span>
        </div>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === totalPages}
          className={`px-2 py-1 rounded-md font-medium transition-all duration-200 ${
            page === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          →
        </button>
      </div>


      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div
          onClick={cancelDelete}
          className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xl w-[90%] max-w-md"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Are you sure you want to delete this movie?
            </h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

       {syncStatus.stage !== 'idle' && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center w-70">
            
            <p className="text-lg font-semibold text-gray-800 mb-2">
              {syncStatus.stage === 'deleting' ? 'Deleting Movie...' : 'Delete Complete'}
            </p>

            {syncStatus.stage === 'deleting' && (
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            )}

            {syncStatus.stage === 'finished' && (
              <>
                <p className="text-gray-700 mb-4">{syncStatus.message}</p>
                <button
                  onClick={closeSyncModal}
                  className="w-[100px] bg-fuchsia-100 text-black px-4 py-2 rounded-lg hover:bg-fuchsia-200"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>    
      )}

    </div>
  );
};

export default AdMovieContent;