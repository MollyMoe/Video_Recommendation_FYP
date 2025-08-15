import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Using axios for consistency
import logoPic from "../images/Cine-It.png";

import { API } from "@/config/api";

const InputGenrePage = () => {
  const navigate = useNavigate();
  const [genreInput, setGenreInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add a loading state for better UX

  const savedUser = JSON.parse(localStorage.getItem("user"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Show loading feedback
    setError("");

    const genres = genreInput.split(",").map((g) => g.trim()).filter(Boolean);

    if (genres.length === 0) {
      setError("Please enter at least one genre.");
      setIsLoading(false);
      return;
    }

    if (!savedUser || !savedUser.userId || !savedUser.username) {
      setError("User information is missing. Please sign in again.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Update the user's profile with their new genres
      await axios.post(`${API}/api/preference/genre`, {
        username: savedUser.username,
        genres,
      });

      // Step 2: Trigger the initial recommendation generation on the backend
      // The backend will now generate and save the first 99 movies for this user.
      console.log("Triggering initial recommendations for the user...");
      await axios.post(`${API}/api/movies/regenerate`, {
        userId: savedUser.userId,
        excludeTitles: [], // No exclusions for the first time
      });
      
      // ✅ THE FIX IS HERE ✅
      console.log("Preferences saved! Navigating to sign-in page.");
      
      // Optional: Add a success message to the navigation state
      navigate("/signin", { state: { message: "Your preferences have been saved! Please sign in to continue." } });

    } catch (err) {
      console.error("Error saving preferences:", err);
      const errorMessage = err.response?.data?.detail || "Failed to save preferences. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading feedback
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20 bg-white space-y-6 px-4 min-h-screen dark:bg-gray-800">
      <img className="w-70 h-20 rounded-full" src={logoPic} alt="Cine-It Logo" />

      <div className="w-full max-w-lg p-6 bg-[#F6EBFF] border rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h5 className="text-xl font-medium text-gray-900 text-center">
            Enter your preferred genres (comma-separated)
          </h5>

          <input
            type="text"
            value={genreInput}
            onChange={(e) => {
              setGenreInput(e.target.value);
              setError("");
            }}
            placeholder="e.g., Action, Comedy, Horror"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            required
            disabled={isLoading}
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="block mx-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md disabled:bg-purple-400"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputGenrePage;