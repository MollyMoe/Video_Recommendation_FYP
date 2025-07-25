import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // Import Link and useParams
import { Play, Trash2, CheckCircle } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserWatchLater = () => {
  const { id: userId } = useParams(); // Get the user ID from the URL path
  const [user, setUser] = useState(null); // State to store the user's details for display
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state for API calls
  const [showSuccess, setShowSuccess] = useState(false);

  // Function to fetch the user's details (username, etc.), similar to AdUserLikedMovies
  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`${API}/api/auth/users/streamer/${userId}`);
      if (!res.ok) throw new Error("User details not found");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user details for admin view:", err);
      // You might want to handle this error more gracefully, e.g., redirect
    }
  };

  const fetchWatchLaterMovies = async (userIdToFetch) => {
    if (!userIdToFetch) {
      setIsLoading(false);
      setError("No user ID found in URL to fetch watch later movies.");
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // Use the API endpoint that returns watch later movies for a given userId
      const res = await fetch(`${API}/api/movies/watchLater/${userIdToFetch}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to fetch watch later movies: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();

      console.log("🎬 Admin Watch Later response:", data);

      const moviesArray = Array.isArray(data.SaveMovies) ? data.SaveMovies : []; // Changed from 'data.watchLaterMovies' to 'data.SaveMovies' as per StWatchLaterPage
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of moviesArray) {
        const movieId = movie._id || movie.movieId;
        if (movieId && !seen.has(movieId)) {
          seen.add(movieId);
          uniqueMovies.push(movie);
        }
      }
      setWatchLaterMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch watch later movies for admin:", err);
      setError(err.message || "An unexpected error occurred while fetching movies.");
      setWatchLaterMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId); // Fetch user details to display username
      fetchWatchLaterMovies(userId); // Fetch watch later movies for this user ID
    } else {
      setIsLoading(false);
      setError("No user ID specified in the URL.");
    }
  }, [userId]); // Re-run when userId from URL changes

  // Admin-specific action to remove a single movie from a user's watch later list
  const handleAdminRemove = async (movieIdToRemove) => {
    if (!userId || !movieIdToRemove) {
      console.warn("Missing userId or movieId for admin removal.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/removeWatchLaterMovie`, { // Example admin endpoint for watch later
        method: "POST", // Or DELETE
        headers: {
          "Content-Type": "application/json",
          // You might need an Admin Auth Token here: "Authorization": `Bearer ${adminAuthToken}`
        },
        body: JSON.stringify({
          userId: userId, // User whose movie list is being modified
          movieId: movieIdToRemove, // Movie to remove
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to remove watch later movie for user: ${errorData.message || res.statusText}`);
      }

      console.log("🗑️ Watch later movie removed by admin.");
      // Update UI by filtering out the removed movie
      setWatchLaterMovies((prev) =>
        prev.filter((m) => {
          const currentMovieId = m._id || m.movieId;
          return currentMovieId?.toString() !== movieIdToRemove?.toString();
        })
      );
      setShowSuccess(true); // show popup
      setTimeout(() => setShowSuccess(false), 2000); // auto-hide
    } catch (err) {
      console.error("❌ Error removing watch later movie as admin:", err);
      setError(err.message || "Failed to remove movie from watch later.");
    }
  };

  return (
    // Main container div for admin page
    <div className="sm:ml-64 min-h-screen pt-20 px-4 sm:px-8 dark:bg-gray-800">
      {/* Back button fixed position, same as AdUserLikedMovies */}
      <div className="fixed top-[125px] left-7 z-50 bg-gray-800"> {/* Ensuring dark background */}
        <Link
          to={`/admin/view/${userId}`}
          className="bg-white border border-gray-400 text-black text-md px-5 py-1.5 rounded-lg shadow-md hover:bg-gray-200"
        >
          Back
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-white text-center">
          Saved Movies for {user ? user.username : "User"}
        </h2>

        {isLoading ? (
          <div className="text-center mt-10 text-white">Loading saved movies...</div>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : watchLaterMovies.length === 0 ? (
          <p className="text-center mt-10 text-white">No saved movies found for this user.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10"> {/* Adjusted to md:grid-cols-4 */}
            {watchLaterMovies.map((movie) => (
              <div
                key={movie._id || movie.movieId}
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[350px]"
              >
                <img
                  src={movie.poster_url || "https://via.placeholder.com/150"}
                  alt={movie.title || "No Title"}
                  className="w-full h-64 object-cover"
                />
                <div className="flex flex-col flex-1 px-4 pt-3 pb-2">
                  <h3 className="text-sm font-semibold text-black line-clamp-2 flex-grow m-0 ">
                    {movie.title || "Untitled"}
                  </h3>
                <div className="m-0 flex justify-center">
                 {/* Admin "Remove" button */}
                  <button
                      onClick={() => handleAdminRemove(movie.movieId)}
                      className="flex items-center justify-center w-24 bg-red-600 text-white text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-red-700"
                   >
                    <Trash2 className="w-3 h-3 mr-1 fill-white" />
                     Remove
                 </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">Loading Saved Movies...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-violet-500" />
            </div>
            <span className="font-medium">Movie removed from saved list!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdUserWatchLater;