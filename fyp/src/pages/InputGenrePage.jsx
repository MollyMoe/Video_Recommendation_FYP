import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoPic from "../images/Cine-It.png";

const API = import.meta.env.VITE_API_BASE_URL;

const InputGenrePage = () => {
  const navigate = useNavigate();
  const [genreInput, setGenreInput] = useState("");
  const [error, setError] = useState("");


  const [genreInput, setGenreInput] = useState("");
  const [error, setError] = useState("");



  const savedUser = JSON.parse(localStorage.getItem("user"));
  const handleSubmit = async (e) => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const handleSubmit = async (e) => {
    e.preventDefault();

    const genres = genreInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g);

    if (genres.length === 0) {
      setError("Please enter at least one genre.");
      return;
    }

    if (!savedUser || !savedUser.username) {
      setError("User information missing. Please sign in again.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/preference/genre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: savedUser.username,
          genres, 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save preferences");
      }

      const updatedUser = { ...savedUser, genres };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log("Preferences saved, redirecting to signin...");
      
      navigate("/signin");
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(err.message || "Failed to save preferences.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20 bg-white space-y-6 px-4">
      <img className="w-70 h-20 rounded-full" src={logoPic} alt="Cine-It Logo" />
    <div className="flex flex-col items-center justify-center mt-20 bg-white space-y-6 px-4">
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
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="block mx-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md"
          >
            Save Preferences
          </button>
        </form>
      </div>
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
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="block mx-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};
  );
};

export default InputGenrePage;
export default InputGenrePage;