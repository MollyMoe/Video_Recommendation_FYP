import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // Import Link and useParams
import { Play, Trash2, CheckCircle } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserHistory = () => {
  const { id: userId } = useParams(); // Get the user ID from the URL path, for the admin to view history for a specific user
  const [user, setUser] = useState(null); // State to store the user's details for display
  const [historyMovies, setHistoryMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state for API calls
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const fetchHistoryMovies = async (userIdToFetch) => {
    if (!userIdToFetch) {
      setIsLoading(false);
      setError("No user ID found in URL to fetch history movies.");
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // Use the API endpoint that returns history movies for a given userId
      const res = await fetch(`${API}/api/movies/historyMovies/${userIdToFetch}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to fetch history movies: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();

      console.log("📽 Admin History movies response:", data);

      const moviesArray = Array.isArray(data.historyMovies) ? data.historyMovies : [];
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of moviesArray) {
        const movieId = movie._id || movie.movieId;
        if (movieId && !seen.has(movieId)) {
          seen.add(movieId);
          uniqueMovies.push(movie);
        }
      }
      setHistoryMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch history movies for admin:", err);
      setError(err.message || "An unexpected error occurred while fetching movies.");
      setHistoryMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId); // Fetch user details to display username
      fetchHistoryMovies(userId); // Fetch history movies for this user ID
    } else {
      setIsLoading(false);
      setError("No user ID specified in the URL.");
    }
  }, [userId]); // Re-run when userId from URL changes

  // Admin-specific action to remove a single movie from a user's history
  const handleAdminRemove = async (movieIdToRemove) => {
    if (!userId || !movieIdToRemove) {
      console.warn("Missing userId or movieId for admin removal.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/removeHistoryMovie`, { // Example admin endpoint for history
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
        throw new Error(`Failed to remove history movie for user: ${errorData.message || res.statusText}`);
      }

      console.log("🗑️ History movie removed by admin.");
      // Update UI by filtering out the removed movie
      setHistoryMovies((prev) =>
        prev.filter((m) => {
          const currentMovieId = m._id || m.movieId;
          return currentMovieId?.toString() !== movieIdToRemove?.toString();
        })
      );
      setShowSuccess(true); // show popup
      setTimeout(() => setShowSuccess(false), 2000); // auto-hide
    } catch (err) {
      console.error("❌ Error removing history movie as admin:", err);
      setError(err.message || "Failed to remove movie from history.");
    }
  };

  // Admin-specific action to remove all history for a user
  const handleAdminRemoveAllHistory = async () => {
    if (!userId) {
      console.warn("⚠️ No userId found for clearing history.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/removeAllHistoryMovies`, { // Example admin endpoint for clearing all history
        method: "POST", // Or DELETE
        headers: {
          "Content-Type": "application/json",
          // You might need an Admin Auth Token here: "Authorization": `Bearer ${adminAuthToken}`
        },
        body: JSON.stringify({ userId: userId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to clear all history for user: ${errorData.message || res.statusText}`);
      }

      console.log("🧹 All history cleared by admin.");
      setHistoryMovies([]); // Clear the local state
      setShowConfirm(false); // Close confirmation popup
      setShowSuccess(true); // Show success popup
      setTimeout(() => setShowSuccess(false), 2000); // auto-hide
    } catch (err) {
      console.error("❌ Error clearing history as admin:", err);
      setError(err.message || "Failed to clear all history.");
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
          Watch History for {user ? user.username : "User"}
        </h2>

        <div className="-mt-4 flex justify-end mb-5">
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-white text-black font-medium border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm shadow-md"
          >
            Clear All History
          </button>
        </div>

        {isLoading ? (
          <div className="text-center mt-10 text-white">Loading watch history...</div>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : historyMovies.length === 0 ? (
          <p className="text-center mt-10 text-white">No watch history found for this user.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10"> {/* Adjusted to md:grid-cols-4 for consistency with LikedMovies */}
            {historyMovies.map((movie) => (
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
                    className="flex items-center justify-center w-24 bg-red-600 text-white text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-red-700"                    >
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
            <p className="text-lg font-semibold">Loading Watch History...</p>
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
            <span className="font-medium">Movie removed from history!</span>
          </div>
        </div>
      )}

      {/* Confirmation Popup for Remove All */}
      {showConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 text-center">
            {/* Header (removed redundant close button, usually placed top-right if needed) */}
            <div className="flex justify-end items-center mb-4">
               <button
                 onClick={() => setShowConfirm(false)}
                 className="text-gray-500 hover:text-gray-700 text-xl font-bold"
               >
                 &times;
               </button>
            </div>


            {/* Message */}
            <p className="mb-6 text-gray-700">
              Are you sure you want to remove all watch history for this user?
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  handleAdminRemoveAllHistory();
                  // setShowConfirm(false); // This will be handled by handleAdminRemoveAllHistory on success
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdUserHistory;