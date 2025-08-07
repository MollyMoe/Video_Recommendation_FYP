import React from "react";
import { Link, useLocation } from "react-router-dom";
import { House, RefreshCw } from "lucide-react";

const AdSideButtons = ({ onUpdateClick, isSyncing }) => {
  // Modified SideButton to align icon and label horizontally
  const SideButton = ({ to, label, current, icon }) => {
    return (
      <Link
        to={to}
        className={`flex flex-row items-center justify-center gap-2 px-4 py-2 rounded-lg my-2 ${
          current
            ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
            : "text-black hover:bg-fuchsia-200 dark:text-white dark:hover:bg-gray-700"
        }`}
      >
        {icon}
        <span className="px-1">{label}</span>
      </Link>
    );
  };
  
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 bg-white/70 dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700">
      <div className="h-full px-4 pb-4 overflow-y-auto mt-2 space-y-2">
        <SideButton
          to="/admin"
          label="Home"
          current={location.pathname === "/admin"}
          icon={<House className="w-4 h-4" />}
        />
        
        <button
          onClick={onUpdateClick}
          disabled={isSyncing}
          // Also apply horizontal flexbox here
          className={`flex flex-row items-center justify-center gap-2 w-full px-4 py-2 rounded-lg my-2 ${
            isSyncing
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "text-black hover:bg-fuchsia-200 dark:text-white dark:hover:bg-gray-700"
          }`}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Update
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdSideButtons;