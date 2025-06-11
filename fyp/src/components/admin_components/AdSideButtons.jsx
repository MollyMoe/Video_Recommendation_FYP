import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const AdSideButtons = () => {
  const SideButton = ({ to, label, current, children }) => {
    return (
      <Link
        to={to}
        className={`block p-1 rounded-lg ${
          current
            ? "bg-gray-200 text-black font-semibold"
            : "hover:bg-gray-200 "
        }`}
      >
        {children || label}
      </Link>
    );
  };

  const location = useLocation();
  return (
    <div>
      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
        <div className="fixed left-5 h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800 ">
          <button className="bg-white border border-gray-400 text-black text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200 ">
            <SideButton
              to="/admin"
              label="Home"
              current={location.pathname === "/admin"}
            />
          </button>
          <br></br>
          <button className="bg-white border border-gray-400 text-black text-md px-4 py-2 mt-10 rounded-lg shadow-md hover:bg-gray-200">
            Update
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AdSideButtons;
