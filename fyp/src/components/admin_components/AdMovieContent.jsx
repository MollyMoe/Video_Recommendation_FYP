import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

const AdMovieContent = ({ searchQuery }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [movies, setMovies] = useState([]);
  const [allFetchedMovies, setAllFetchedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🧠 Fetch movies on load
  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${API}/api/movies/all`)
      .then((res) => {
        const unique = [];
        const seenTitles = new Set();

        const validMovies = res.data.filter(
          (movie) =>
            movie.poster_url &&
            typeof movie.poster_url === 'string' &&
            movie.poster_url.toLowerCase() !== 'nan' &&
            movie.poster_url.trim() !== ''
        );

        for (const movie of validMovies) {
          if (!seenTitles.has(movie.title)) {
            seenTitles.add(movie.title);
            unique.push(movie);
          }
        }

        setMovies(unique);
        setAllFetchedMovies(unique);
      })
      .catch((err) => {
        console.error('❌ Failed to fetch movies', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 🔍 Filter movies when searchQuery changes
  useEffect(() => {
    const trimmed = searchQuery?.trim().toLowerCase();

    if (!trimmed) {
      setMovies(allFetchedMovies);
      return;
    }

    const filtered = allFetchedMovies.filter(
      (movie) =>
        movie.title?.toLowerCase().includes(trimmed) ||
        movie.director?.toLowerCase().includes(trimmed)
    );

    setMovies(filtered);
  }, [searchQuery, allFetchedMovies]);

  // 🗑️ Delete logic
  const handleDelete = (id) => {
    setMovies(movies.filter((movie) => movie._id !== id));
    setAllFetchedMovies(allFetchedMovies.filter((movie) => movie._id !== id));
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

  // ⏳ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading movies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:ml-40 px-4 pt-30 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      {/* 🎬 Movie Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div
            key={movie._id}
            className="w-[140px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center"
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full aspect-[9/16] object-cover"
            />
            <div className="w-full p-2 flex justify-center">
              <button
                onClick={() => openConfirm(movie._id)}
                className="flex justify-center items-center space-x-2 text-gray-800 py-2 rounded-xl hover:bg-gray-100 dark:text-white dark:hover:bg-gray-500"
              >
                <FaTrash />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🧾 Delete Confirmation Modal */}
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
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdMovieContent;
