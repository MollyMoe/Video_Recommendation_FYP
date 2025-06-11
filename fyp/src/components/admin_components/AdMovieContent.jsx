import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import movieData from '../../data/movieData'; // Adjust the path as needed

const AdMovieContent = () => {
  const [movies, setMovies] = useState(movieData);

  const handleDelete = (id) => {
    setMovies(movies.filter((movie) => movie.id !== id));
  };

  return (
    <div className="sm:ml-40  px-4 4 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="w-[140px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center"
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full aspect-[9/16] object-cover"
            />
            <div className="w-full p-2 flex justify-center p-2">
              <button
                onClick={() => handleDelete(movie.id)}
                className="flex justify-center w-65 text-gray-800 py-2 rounded-xl hover:bg-gray-100 dark:text-white dark:hover:bg-gray-500"
              >
                < FaTrash />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdMovieContent;
