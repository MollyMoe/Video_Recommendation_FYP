import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useOutletContext } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const AdRecentlyAddedMovies = () => {
    const [recentlyAddedPersistent, setRecentlyAddedPersistent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const outletContext = useOutletContext() || {};
    const { updateFlag } = outletContext;

    useEffect(() => {
        const fetchRecentlyAddedPersistent = async () => {
            setIsLoading(true);
            try {

                const batchIdResponse = await axios.get(`${API}/api/movies/latest-sync-batch-id`);
                const latestBatchId = batchIdResponse.data?.latest_batch_id;
                console.log("Fetched latest batch ID:", latestBatchId);

                if (latestBatchId) {
                    const moviesResponse = await axios.get(`${API}/api/movies/recently-added-persistent`, {
                        params: { batch_id: latestBatchId } 
                    });
                    console.log("📦 Persistent recently added movies response for batch:", moviesResponse.data);
                    setRecentlyAddedPersistent(moviesResponse.data); 
                } else {

                    console.log("No latest batch ID found, clearing recently added movies.");
                    setRecentlyAddedPersistent([]); 
                }
            } catch (err) {
                console.error("❌ Failed to fetch persistent recently added movies", err);
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
                <p className="text-sm">Click 'Update' on the 'All Movies' tab (or the side button) to sync new movies from the 'added' collection.</p>
            </div>
        );
    }

    return (
        <div className="sm:ml-0 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700 mr-50">
            <div className="mb-6 mt-10 p-4 bg-green-50 dark:bg-green-800 rounded-lg shadow-inner">
                <h2 className="text-green-700 dark:text-green-200 font-bold text-lg mb-3">🆕 Recently Added</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recentlyAddedPersistent.map(movie => ( 
                        <div key={movie._id} className="bg-green-100 dark:bg-green-700 p-2 rounded shadow text-center">
                            {/* Movie poster */}
                            <img 
                                src={movie.poster_url} 
                                alt={movie.title} 
                                className="w-full aspect-[9/16] object-cover mb-1 rounded" 
                            />
                            {/* Movie title */}
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{movie.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdRecentlyAddedMovies;