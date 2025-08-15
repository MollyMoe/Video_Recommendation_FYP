import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Users, UserCheck, Film } from "lucide-react";
import { useUser } from '../../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AdDashboard = () => {
  const [user, setUser] = useState({ username: "Admin", email: "loading..." });
  const [currentDate, setCurrentDate] = useState("");

  const [stats, setStats] = useState({
    totalUsers: '...',
    newUsers: '...',
    totalMovies: '...',
    newMovies: '...',
  });

  const { profileImage } = useUser();
  const defaultImage = "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg";

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser || !savedUser.userId) {
      console.error("User not found in local storage.");
      setUser({ username: "Error", email: "User not found" });
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/admin/${savedUser.userId}`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUser({
          username: data.username || "Admin",
          email: data.email || "No email provided"
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser({ username: "Error", email: "Could not load data" });
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const res = await fetch(`${API}/api/auth/stats`);
        if (!res.ok) throw new Error('Could not fetch platform stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats({ totalUsers: 'N/A', newUsers: 'N/A', totalMovies: 'N/A', newMovies: 'N/A' });
      }
    };

    fetchUser();
    fetchDashboardStats();

    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('en-US', options));
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-120 bg-white dark:bg-gray-800 shadow-lg">
        <nav className="mt-40 p-10">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={profileImage || defaultImage}
                alt="User Profile"
                className="w-28 h-28 rounded-full shadow-lg border-4 border-purple-500/50 dark:border-purple-400/50"
              />
              <span className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"></span>
            </div>

            <div className="w-full mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-inner">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                  {user.username}
                </h3>
              </div>
              <hr className="my-3 border-gray-200 dark:border-gray-600/50" />
              <div className="text-center">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Administrator</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 break-all mt-1">{user.email}</p>
              </div>
              <Link
                to="/admin/editProfile"
                className="block w-full mt-5 px-4 py-2 text-sm font-medium text-center text-white bg-purple-400 rounded-lg hover:bg-purple-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 mt-16 overflow-y-auto">
        <div>
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 mt-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Welcome Back, {user.username}!
              </h1>
            </div>
            <div className="text-base md:text-md text-gray-500 dark:text-gray-400 font-medium mt-4 
                md:mt-0 px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              {currentDate}
            </div>
          </header>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users className="w-8 h-8 text-sky-500" />} title="Total Users" value={stats.totalUsers} />
            <StatCard icon={<Film className="w-8 h-8 text-red-500" />} title="Total Movies" value={stats.totalMovies} />
            <StatCard icon={<UserCheck className="w-8 h-8 text-emerald-500" />} title="New Users (30d)" value={stats.newUsers} />
            <StatCard icon={<Video className="w-8 h-8 text-amber-500" />} title="New Movies (30d)" value={stats.newMovies} />
          </div>

          {/* Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Actions</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ActionCard
                to="/admin/manageUser"
                icon={<Users className="w-16 h-16 text-blue-500" />}
                title="Manage User Profile"
              />
              <ActionCard
                to="/admin/video"
                icon={<Video className="w-16 h-16 text-red-500" />}
                title="Manage Video Content"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

  const StatCard = ({ icon, title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center justify-between transition-transform transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );

  const ActionCard = ({ to, icon, title }) => (
    <Link to={to}>
      <div className="flex flex-col items-center p-8 text-center bg-white rounded-lg shadow-md hover:shadow-xl dark:bg-gray-800  dark:hover:shadow-gray-700">
        {icon}
        <h3 className="text-xl mt-4 font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
      </div>
    </Link>
  );

export default AdDashboard;