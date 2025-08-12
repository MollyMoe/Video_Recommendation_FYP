import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const StSideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const StSidebarButton = ({ to, label, current, children }) => {
    const handleClick = (e) => {
      e.preventDefault();
      if (current) {
        // Reload the page if clicking on the active route
        window.location.reload();
      } else {
        // Navigate normally
        navigate(to);
      }
    };

    return (
      <a
        href={to}
        onClick={handleClick}
        className={`block p-4 rounded-lg ${
          current
            ? "bg-fuchsia-100 text-black font-semibold"
            : "hover:bg-fuchsia-100 dark:hover:bg-gray-700"
        }`}
      >
        {children || label}
      </a>
    );
  };

  return (
    <aside
      id="logo-sidebar"
      className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <ul className="mt-7 space-y-2 font-medium text-center text-black dark:text-white">
          <li>
            <StSidebarButton
              to="/home"
              label="Home"
              current={location.pathname === "/home"}
            />
          </li>

          <hr className="my-2 border-gray-300" />

          <li>
            <StSidebarButton
              to="/home/history"
              label="History"
              current={location.pathname === "/home/history"}
            />
          </li>
          <li>
            <StSidebarButton
              to="/home/watchLater"
              label="Watch Later"
              current={location.pathname === "/home/watchLater"}
            />
          </li>
          <li>
            <StSidebarButton
              to="/home/like"
              label="Liked Movie"
              current={location.pathname === "/home/like"}
            />
          </li>

          <hr className="my-2 border-gray-300" />

          <li>
            <StSidebarButton
              to="/home/filter"
              label="Filter Recommendations"
              current={location.pathname === "/home/filter"}
            />
          </li>

          <hr className="my-2 border-gray-300" />

          <li>
            <StSidebarButton
              to="/home/setting"
              label="Setting"
              current={location.pathname === "/home/setting"}
            />
          </li>
          <li>
            <StSidebarButton
              to="/home/help"
              label="Help"
              current={location.pathname === "/home/help"}
            />
          </li>
          <li>
            <StSidebarButton
              to="/home/sendfeedback"
              label="Send Feedback"
              current={location.pathname === "/home/sendfeedback"}
            />
          </li>
          <li>
            <StSidebarButton
              to="/home/subscription"
              label="Subscription"
              current={location.pathname === "/home/subscription"}
            />
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default StSideBar;
