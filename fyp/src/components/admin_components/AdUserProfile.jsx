import { useEffect, useRef, useState } from "react";
import { FaUserEdit, FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { Link, useNavigate } from "react-router-dom";
<<<<<<< HEAD
=======

>>>>>>> c87e97ec1acdecc208442b1bd6addc859ca2c284

const API = import.meta.env.VITE_API_BASE_URL;
const defaultImage =
  "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg";

function AdUserProfile() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { profileImage, updateProfileImage, setCurrentRole } = useUser();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.userType !== "admin") return;

    setCurrentRole("admin");

    const cached = localStorage.getItem("admin_profileImage");

    // 1. Fallback to cached or default immediately
    const fallbackImage = cached || user.profileImage || defaultImage;
    updateProfileImage(fallbackImage, "admin");

    // 2. Try fetching latest from backend (if online)
    fetch(`${API}/api/auth/users/admin/${user.userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profileImage) {
          updateProfileImage(data.profileImage, "admin");
          localStorage.setItem("admin_profileImage", data.profileImage);
        }
      })
      .catch((err) => {
        console.warn("Offline or failed to fetch image:", err);
      });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin_profileImage");
    navigate("/signin");
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex text-sm bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <img
          className="w-10 h-10 rounded-full"
          src={profileImage || defaultImage}
          alt="User"
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 rounded-md shadow-lg ring-1 ring-gray-300 dark:ring-gray-600 ring-opacity-5 z-10">
          <ul className="py-1">
            <li>
              <Link
                to="/admin/editProfile"
                className="flex items-center px-4 py-2 hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <FaUserEdit className="mr-2" /> Edit Profile
              </Link>
            </li>
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            <li
              onClick={toggleDarkMode}
              className="flex items-center px-4 py-2 hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <FaSun className="mr-2" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <FaMoon className="mr-2" />
                  <span>Dark Mode</span>
                </>
              )}
            </li>
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            <li
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <FaSignOutAlt className="mr-2" /> Sign Out
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AdUserProfile;
