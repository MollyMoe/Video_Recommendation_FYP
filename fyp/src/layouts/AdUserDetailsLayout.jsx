import { Outlet, useParams, useLocation, Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { House, ArrowLeft } from "lucide-react";

import { getAPI } from "@/config/api";

const API = getAPI();

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

  if (!user) return <div className="text-red-600">Loading user...</div>;

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US");

  return (
    <div className="flex min-h-screen bg-gray-100 pt-20">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 bg-white/70 dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="h-full px-4 pb-4 overflow-y-auto mt-2 space-y-2">

          {/* Home */}
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 dark:text-white hover:bg-fuchsia-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <House className="w-4 h-4" />
            Home
          </Link>

          {/* Back */}
          <Link
            to="/admin/manageUser"
            state={{ searchQuery }}
            className="flex items-center gap-3 px-4 py-2 text-gray-800 dark:text-white hover:bg-fuchsia-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 ml-40">
        {/* User Header */}
        <div className="flex items-center space-x-6 bg-white p-6 rounded shadow">
          <img src={user.profileImage} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white shadow-md" />
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600 text-sm">Created on : {formattedDate}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 bg-white p-4 rounded shadow">
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
                  `pb-2 text-sm font-medium ${
                    isActive ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-blue-600"
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
