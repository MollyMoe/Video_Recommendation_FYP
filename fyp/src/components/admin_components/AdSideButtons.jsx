import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdSideButtons = ({ onUpdateClick, isSyncing }) => {
  const SideButton = ({ to, label, current, children }) => {
    return (
      <Link
        to={to}
        className={`block px-4 py-2 rounded-lg my-2 text-center ${
          current
            ? "bg-gray-200 text-black font-semibold"
            : "text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
        }`}
      >
        {children || label}
      </Link>
    );
  };

  const location = useLocation();

  return (
    <aside
      id="logo-sidebar"
      className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <SideButton
          to="/admin"
          label="Home"
          current={location.pathname === "/admin"}
        />
        {/* Modify the Update button to use isSyncing */}
        <button
          onClick={onUpdateClick}
          disabled={isSyncing} // Disable if syncing
          className={`block w-full px-4 py-2 rounded-lg my-2 text-center ${
            isSyncing
              ? "bg-gray-400 text-gray-700 cursor-not-allowed" // Styles for disabled state
              : "text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
          }`}
        >
          {isSyncing ? "Syncing..." : "Update"} {/* Text changes during sync */}
        </button>
        {/* Add the rest of your side buttons here if any */}
      </div>
    </aside>
  );
};

export default AdSideButtons;
