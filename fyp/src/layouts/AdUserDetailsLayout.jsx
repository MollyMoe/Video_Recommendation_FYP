import { Outlet, useParams, useLocation, Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { House, ArrowLeft } from "lucide-react";

import { API } from "@/config/api";

const AdUserDetailsLayout = () => {
  const { id } = useParams();
  const location = useLocation();
  const restoredSearch = location.state?.searchQuery || "";
  const [searchQuery] = useState(restoredSearch);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${id}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("User fetch failed:", err);
      }
    };
    fetchUser();
  }, [id]);

  // --- FIX: Added dark mode text color to the loading state ---
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Loading user...
      </div>
    );
  }

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 pt-20">
      <aside className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="h-full px-4 pb-4 overflow-y-auto mt-2 space-y-2">
          {/* Home */}
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-fuchsia-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <House className="w-4 h-4" />
            Home
          </Link>

          {/* Back */}
          <Link
            to="/admin/manageUser"
            state={{ searchQuery }}
            className="flex items-center gap-3 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-fuchsia-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 ml-40">
        {/* User Header */}
        <div className="flex items-center space-x-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
          <img
            src={user.profileImage}
            alt="Profile"
            className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-600 shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Created on: {formattedDate}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-transparent dark:border-gray-700">
          <div className="flex gap-8">
            {[
              { label: "Overview", to: "overview" },
              { label: "Subscription", to: "subscription" },
              { label: "Suspension", to: "suspension" },
              { label: "Liked Videos", to: "liked" },
              { label: "Watch Later", to: "watchLater" },
              { label: "Watch History", to: "history" },
            ].map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                state={{ searchQuery }}
                className={({ isActive }) =>
                  `pb-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
                      : "text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Render nested route here */}
        <div className="mt-6">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
};

export default AdUserDetailsLayout;