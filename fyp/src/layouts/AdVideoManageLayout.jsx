// AdVideoManageLayout.jsx
import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import axios from "axios";
import AdSideButtons from "../components/admin_components/AdSideButtons";
import { useState } from "react";

import { getAPI } from "@/config/api";

const tabs = [
  { label: "All Movies", path: "/admin/video/videoHomePage" },
  { label: "Top Liked", path: "/admin/video/manage" },
  { label: "Recently Added", path: "/admin/video/recently-added" },
  { label: "Genres", path: "/admin/video/genre" }
];

const AdVideoManageLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [recentMoviesGlobal, setRecentMoviesGlobal] = useState([]);
  const [updateFlag, setUpdateFlag] = useState(false);

  const [syncStatus, setSyncStatus] = useState({
    stage: 'idle',
    message: ''
  });

  const handleUpdateClick = async () => {
    setSyncStatus({ stage: 'syncing', message: '' });

    try {
      const response = await axios.post(`${API}/api/movies/sync-added-movies`);
      const newlyAddedMovies = response.data.newly_added_movies || [];
      
      setRecentMoviesGlobal(newlyAddedMovies.length > 0 ? newlyAddedMovies : []);
      setUpdateFlag((prev) => !prev);

      setTimeout(() => {
        setSyncStatus({
          stage: 'finished',
          message: response.data.message
        });
      }, 2000);

    } catch (error) {
      setTimeout(() => {
        setSyncStatus({
          stage: 'finished',
          message: "Failed to sync movies: " + (error.response?.data?.detail || error.message)
        });
      }, 2000);
    }
  };

  const closeSyncModal = () => {
    setSyncStatus({ stage: 'idle', message: '' });
  };

  return (
    <>
      <AdSideButtons onUpdateClick={handleUpdateClick} isSyncing={syncStatus.stage === 'syncing'} />

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
        <Outlet context={{ recentMoviesGlobal, setRecentMoviesGlobal, updateFlag }} />
      </div>

      {syncStatus.stage !== 'idle' && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center w-70">
            
            <p className="text-lg font-semibold text-gray-800">
              {syncStatus.stage === 'syncing' ? 'Syncing new movies...' : 'Sync Complete'}
            </p>

            {syncStatus.stage === 'syncing' && (
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            )}

            {syncStatus.stage === 'finished' && (
              <>
                <p className="text-gray-700 mb-4">{syncStatus.message}</p>
                <button
                  onClick={closeSyncModal}
                  className="w-[100px] bg-fuchsia-100 text-black px-4 py-2 rounded-lg hover:bg-fuchsia-200"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>    
      )}
    </>
  );
};

export default AdVideoManageLayout;