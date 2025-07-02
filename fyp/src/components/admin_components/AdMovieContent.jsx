// import React, { useState } from 'react';
// import { FaTrash } from 'react-icons/fa';
// import movieData from '../../data/movieData';

// const AdMovieContent = () => {
//   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
//   const [selectedMovieId, setSelectedMovieId] = useState(null);
//   const [movies, setMovies] = useState(movieData);

//   const handleDelete = (id) => {
//     setMovies(movies.filter((movie) => movie.id !== id));
//   };

//   const openConfirm = (id) => {
//     console.log('Clicked delete for movie:', id);
//     setSelectedMovieId(id);
//     setIsConfirmOpen(true);
//   };

//   const confirmDelete = () => {
//     if (selectedMovieId) {
//       handleDelete(selectedMovieId);
//     }
//     setIsConfirmOpen(false);
//     setSelectedMovieId(null);
//   };

//   const cancelDelete = () => {
//     setIsConfirmOpen(false);
//     setSelectedMovieId(null);
//   };


//   return (
//     <div className="sm:ml-40  px-4 4 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//         {movies.map((movie) => (
//           <div
//             key={movie.id}
//             className="w-[140px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center"
//           >
//             <img
//               src={movie.poster}
//               alt={movie.title}
//               className="w-full aspect-[9/16] object-cover"
//             />
//             <div className="w-full p-2 flex justify-center p-2">
//               <button
//                 onClick={() => openConfirm(movie.id)}
//                 className="flex justify-center w-65 text-gray-800 py-2 rounded-xl hover:bg-gray-100 dark:text-white dark:hover:bg-gray-500"
//               >
//                 < FaTrash />
//                 <span className="text-sm">Delete</span>
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Modal */}
//       {isConfirmOpen && (
//         <div
//           onClick={cancelDelete}
//           className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50"
//           aria-modal="true"
//           role="dialog"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xl w-[90%] max-w-md"
//           >
//             <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
//               Are you sure you want to delete?
//             </h2>
//             <div className="flex justify-end space-x-4">
//               <button
//                 onClick={cancelDelete}
//                 className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
//               >
//                 Yes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdMovieContent;

import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';

const AdMovieContent = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [movies, setMovies] = useState([]);

  // Fetch movies from MongoDB collection hybridRecommendation2
  useEffect(() => {
    axios
      .get('http://localhost:3001/api/movies/all') // Adjust if deployed
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
      })
      .catch((err) => {
        console.error('❌ Failed to fetch movies', err);
      });
  }, []);

  const handleDelete = (id) => {
    setMovies(movies.filter((movie) => movie._id !== id));

    // OPTIONAL: delete from backend
    // axios.delete(`http://localhost:3001/api/movies/${id}`)
    //   .then(() => console.log('Deleted from DB'))
    //   .catch(err => console.error('❌ Failed to delete from DB', err));
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

  return (
    <div className="sm:ml-40 px-4 pt-30 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
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
