import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; 
import { Play, Trash2 } from "lucide-react"; 

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserLikedMovies = () => {
  const { id: userId } = useParams(); // Get the user ID from the URL path
  const [user, setUser] = useState(null); // State to store the user's details for display
  const [likedMovies, setLikedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch the user's details (username, etc.)
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

  const fetchLikedMovies = async (userIdToFetch) => {
    if (!userIdToFetch) {
      setIsLoading(false);
      setError("No user ID found in URL to fetch liked movies.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the API endpoint that returns liked movies for a given userId
      // This endpoint must be accessible by an authenticated admin and return the data for the requested userId
      const res = await fetch(`${API}/api/movies/likedMovies/${userIdToFetch}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Failed to fetch liked movies: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();

      console.log("🎬 Admin Liked movies response:", data);

      const moviesArray = Array.isArray(data.likedMovies) ? data.likedMovies : [];
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of moviesArray) {
        const movieId = movie._id || movie.movieId;
        if (movieId && !seen.has(movieId)) {
          seen.add(movieId);
          uniqueMovies.push(movie);
        }
      }
      setLikedMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch liked movies for admin:", err);
      setError(err.message || "An unexpected error occurred while fetching movies.");
      setLikedMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId); // Fetch user details to display username
      fetchLikedMovies(userId); // Fetch liked movies for this user ID
    } else {
      setIsLoading(false);
      setError("No user ID specified in the URL.");
    }
  }, [userId]); // Re-run when userId from URL changes

  // Admin-specific actions (e.g., removing a movie from a user's liked list)
  const handleAdminRemove = async (movieIdToRemove) => {
    if (!userId || !movieIdToRemove) {
      console.warn("Missing userId or movieId for admin removal.");
      return;
    }

    try {
      // This should be an admin-privileged endpoint to remove a movie from a specific user's liked list
      const res = await fetch(`${API}/api/admin/removeLikedMovie`, { // Example admin endpoint
        method: "POST", // Or DELETE, depending on your API design
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
        throw new Error(`Failed to remove movie for user: ${errorData.message || res.statusText}`);
      }

      console.log("🗑️ Movie removed by admin.");
      // Update UI by filtering out the removed movie
      setLikedMovies((prev) =>
        prev.filter((m) => {
          const currentMovieId = m._id || m.movieId;
          return currentMovieId?.toString() !== movieIdToRemove?.toString();
        })
      );
      // Optional: Show a success message
    } catch (err) {
      console.error("❌ Error removing movie as admin:", err);
      setError(err.message || "Failed to remove movie.");
    }
  };

  return (
    <div className="sm:ml-64 min-h-screen pt-20 px-4 sm:px-8 dark:bg-gray-800">
      {/* Admin specific navigation if any, or just a back button */}
      <div className="fixed top-[125px] left-7 z-50 bg-white dark:bg-gray-800">
        <Link
          to={`/admin/view/${userId}`}
          className="bg-white border border-gray-400 text-black text-md px-5 py-1.5 rounded-lg shadow-md hover:bg-gray-200"
        >
          Back
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">


        <h2 className="text-3xl font-bold mb-6 text-white text-center">
          Liked Movies for {user ? user.username : "User"}
        </h2>


        {isLoading ? (
          <div className="text-center mt-10 text-white">Loading liked movies...</div>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : likedMovies.length === 0 ? (
          <p className="text-center mt-10 text-white">No liked movies found for this user.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {likedMovies.map((movie) => (
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
                  <div className="m-0 flex justify-center gap-3">
                    {/* Admin can play for testing, but typically this might be removed or lead to a "preview" */}
                    <button
                      onClick={() => console.log("Admin Play clicked (implement preview logic if needed)")}
                      className="flex items-center justify-center w-20 bg-gray-300 text-gray-800 text-xs px-2 py-1 rounded-lg shadow-sm cursor-not-allowed" // Admin might not "play" for history tracking
                      disabled // Disable if admin doesn't track history for themselves
                    >
                      <Play className="w-3 h-3 mr-1 fill-gray-800" />
                      Play
                    </button>

                    {/* Admin "Remove" button */}
                    <button
                      onClick={() => handleAdminRemove(movie.movieId)}
                      className="flex items-center justify-center w-20 bg-red-600 text-white text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-red-700"
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
    </div>
  );
};

export default AdUserLikedMovies;