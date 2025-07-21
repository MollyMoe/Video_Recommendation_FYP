import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdUserTable from "./AdUserTable";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserDetails = () => {
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
const restoredSearch = location.state?.searchQuery || "";
const restoredPage = location.state?.page || 1;

const [searchQuery, setSearchQuery] = useState(restoredSearch);
const [page, setPage] = useState(restoredPage);

  useEffect(() => {
    localStorage.setItem("searchQuery", searchQuery);
  }, [searchQuery]);

  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async (userId) => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${userId}`);
        if (!res.ok) {
          throw new Error("User not found");
        }
        const data = await res.json();
          if (data.profileImage) {
            data.profileImage = data.profileImage;
          }

          setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      }
    };

    fetchUser(id);
  }, [id]);

  if (!user) return <div className="text-red-600">User not found</div>;

  return (
    <div className="min-h-screen pt-30 px-4 sm:px-8 dark:bg-gray-800 ">
      {/* Back button fixed position */}
      <div className="fixed top-[125px] left-7 z-50 bg-white dark:bg-gray-800">
        <Link
          to="/admin/manageUser"
          state={{ searchQuery }}
          className="bg-white border border-gray-400 text-black text-md px-5 py-1.5 rounded-lg shadow-md hover:bg-gray-200"
        >
          Back
        </Link>
      </div>

      {/* Main user details card */}
      <div className="p-6 w-[500px] h-[500px] mx-auto bg-white border border-gray-300 rounded shadow flex flex-col">
        {/* User Profile Image */}
        <img
          src={user.profileImage}
          className="w-25 h-25 mt-7 ml-7 rounded-full border-3 border-neutral-50 shadow-xl"
        />
        {/* User info fields */}
        <div className="flex flex-col gap-6 w-full flex-grow justify-center">
          {/* Username field */}
          <div className="flex items-center">
            <label className="w-48 font-medium text-gray-700">Username</label>
            <div className="relative w-full">
              <span className="absolute left-0 top-0 bottom-0 w-px bg-gray-400"></span>
              <input
                type="text"
                value={user.username}
                disabled
                className="bg-white border border-white pl-6 pr-3 py-1.5 shadow-sm w-full h-9 leading-6"
              />
            </div>
          </div>

          {/* Contact Info field */}
          <div className="flex items-center">
            <label className="w-48 font-medium text-gray-700">
              Contact Info
            </label>
            <div className="relative w-full">
              <span className="absolute left-0 top-0 bottom-0 w-px bg-gray-400"></span>
              <input
                type="text"
                value={user.email}
                disabled
                className="bg-white border border-white pl-6 pr-3 py-1.5 shadow-sm w-full h-9 leading-6"
              />
            </div>
          </div>

          {/* Preference Movie Genre field */}
          <div className="flex items-center">
            <label className="w-48 font-medium text-gray-700">
              Preference Movie Genre
            </label>
            <div className="relative w-full">
              <span className="absolute left-0 top-0 bottom-0 w-px bg-gray-400"></span>
              <input
                type="text"
                value={Array.isArray(user.genres) ? user.genres.join(", ") : ""}
                disabled
                className="bg-white border border-white pl-6 pr-3 py-1.5 shadow-sm w-full h-9 leading-6"
              />
            </div>
          </div>

          {/* Joined Since field */}
          <div className="flex items-center">
            <label className="w-48 font-medium text-gray-700">
              Joined Since
            </label>
            <div className="relative w-full">
              <span className="absolute left-0 top-0 bottom-0 w-px bg-gray-400"></span>
              <input
                type="text"
                value={user.createdAt}
                disabled
                className="bg-white border border-white pl-6 pr-3 py-1.5 shadow-sm w-full h-9 leading-6"
              />
            </div>
          </div>
        </div>
        {/* Action buttons for liked, watch history, and saved movies */}
        <div className="flex flex-row flex-wrap justify-center gap-3 mt-7 w-full">
          <Link
            to={`/admin/view/${id}/like`}
            className="flex-1 min-w-[120px] text-center py-2 px-2 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-400"
          >
            Liked Movies
          </Link>
          <Link
            to={`/admin/view/${id}/history`}
            className="flex-1 min-w-[120px] text-center py-2 px-2 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-400"
          >
            Watch History
          </Link>
          <Link
            to={`/admin/view/${id}/watchLater`}
            className="flex-1 min-w-[120px] text-center py-2 px-2 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-400"
          >
            Saved Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdUserDetails;

