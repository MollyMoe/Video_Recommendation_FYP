// AdVideoManageLayout.jsx
import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import axios from "axios";
import AdSideButtons from "../components/admin_components/AdSideButtons";
import { useState } from "react";

import { API } from "@/config/api";

const tabs = [
  { label: "All Movies", path: "/admin/video/videoHomePage" },
  { label: "Top Liked", path: "/admin/video/topLiked" },
  { label: "Genres", path: "/admin/video/genre" },
  { label: "Recently Added", path: "/admin/video/recently-added" },
];

const AdVideoManageLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [recentMoviesGlobal, setRecentMoviesGlobal] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  const handleUpdateClick = async () => {
    setIsSyncing(true);

    try {
      console.log("🚀 Triggering movie synchronization on backend...");
      const response = await axios.post(`${API}/api/movies/sync-added-movies`);
      console.log("✅ Backend sync response:", response.data);

      const newlyAddedMovies = response.data.newly_added_movies || [];
      
      if (newlyAddedMovies.length > 0) {
        setRecentMoviesGlobal(newlyAddedMovies); 
        console.log("Identified", newlyAddedMovies.length, "truly new movies after sync.");
      } else {
        setRecentMoviesGlobal([]); // No new movies found after sync
      }

      setUpdateFlag((prev) => !prev);

      alert(response.data.message);

    } catch (error) {
      console.error("❌ Error during movie synchronization:", error);
      alert("Failed to sync movies: " + (error.response?.data?.detail || error.message || "An unknown error occurred."));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <AdSideButtons onUpdateClick={handleUpdateClick} isSyncing={isSyncing} />
      <div className="p-6 dark:bg-gray-900 min-h-screen mt-20 ml-40">
        <div className="flex justify-center mb-8 space-x-4">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                currentPath === tab.path
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Dynamic page content renders here */}
        <Outlet context={{ recentMoviesGlobal, setRecentMoviesGlobal, updateFlag }} />
      </div>

      {isSyncing && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold text-gray-800">
              Syncing new movies... Please wait.
            </p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      )}
    </>
  );
};

export default AdVideoManageLayout;