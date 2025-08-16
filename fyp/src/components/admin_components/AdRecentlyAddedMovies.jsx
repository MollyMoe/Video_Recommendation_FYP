import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useOutletContext } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const AdRecentlyAddedMovies = () => {
  const [recentlyAddedPersistent, setRecentlyAddedPersistent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { updateFlag } = useOutletContext();

  useEffect(() => {
    const fetchRecentlyAddedPersistent = async () => {
      setIsLoading(true);
      try {
        const batchIdResponse = await axios.get(`${API}/api/movies/latest-sync-batch-id`);
        const latestBatchId = batchIdResponse.data?.latest_batch_id;

        if (latestBatchId) {
          const moviesResponse = await axios.get(`${API}/api/movies/recently-added-persistent`, {
            params: { batch_id: latestBatchId }
          });
          setRecentlyAddedPersistent(moviesResponse.data);
        } else {
          setRecentlyAddedPersistent([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch recently added movies", err);
        setRecentlyAddedPersistent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyAddedPersistent();
  }, [updateFlag]);

  if (isLoading) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 mt-10">
        <p>Loading recently added movies...</p>
      </div>
    );
  }

  if (!recentlyAddedPersistent || recentlyAddedPersistent.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 mt-10">
        <p className="text-lg">No recently added movies to display.</p>
        <p className="text-sm">Click 'Update' on the 'All Movies' tab to sync new movies.</p>
      </div>
    );
  }

return (
  <div className="mt-8">
    <div className="inline-block bg-fuchsia-100/50 dark:bg-white/50 rounded-lg shadow-md px-6 py-4">
      {/* Title */}
      <h2 className="text-purple-900 dark:text-purple-100 font-semibold text-lg mb-4">
        Recently Added
      </h2>

      {/* Movie Grid */}
        <div
        className={`grid gap-6 ${
          recentlyAddedPersistent.length === 1
            ? 'grid-cols-1'
            : recentlyAddedPersistent.length === 2
            ? 'grid-cols-2'
            : recentlyAddedPersistent.length === 3
            ? 'grid-cols-3'
            : recentlyAddedPersistent.length === 4
            ? 'grid-cols-4'
            : recentlyAddedPersistent.length === 5
            ? 'grid-cols-5'
            : 'grid-cols-6'
        }`}>
        {recentlyAddedPersistent.map((movie) => (
          <div
            key={movie._id}
            className="bg-white dark:bg-gray-900 p-2 rounded-md shadow-sm border border-purple-200 dark:border-purple-600 text-center max-w-[200px]"
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full aspect-[9/16] object-cover rounded mb-2"
            />
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {movie.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default AdRecentlyAddedMovies;

