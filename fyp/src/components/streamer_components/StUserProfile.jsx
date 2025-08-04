import { useEffect, useRef, useState } from "react";
import { FaUserEdit, FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { Link } from "react-router-dom";
import { API } from "@/config/api";

const defaultImage = "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg";

function StUserProfile({ userProfile }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);

  const { profileImage, updateProfileImage, setCurrentRole } = useUser();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.userType !== "streamer") return;

    setCurrentRole("streamer");

    const cached = localStorage.getItem("streamer_profileImage");

    // 1. Fallback to cached or default immediately
    const fallbackImage = cached || user.profileImage || defaultImage;
    updateProfileImage(fallbackImage, "streamer");

    // 2. Try fetching latest from backend (if online)
    fetch(`${API}/api/auth/users/streamer/${user.userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profileImage) {
          updateProfileImage(data.profileImage, "streamer");
          localStorage.setItem("streamer_profileImage", data.profileImage);
        }
      })
      .catch((err) => {
        console.warn("Offline or failed to fetch image:", err);
      });
  }, []);



  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    setCurrentRole("streamer");
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


 
const handleSignout = async () => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (!savedUser?.userId || !savedUser?.userType) {
    console.warn("⚠️ No valid user session found.");
  } else {
    const payload = {
      userId: savedUser.userId,
      userType: savedUser.userType,
      time: new Date().toISOString(),
      reason: "manual",
    };

    if (navigator.onLine) {
      try {
        await axios.post(`${API}/api/auth/update-signout-time`, payload);
        console.log("✅ Signout time recorded to backend");
      } catch (err) {
        console.error("❌ Failed to record signout time:", err);
        // Optional: fallback to local save here too
        if (window.electron?.saveOfflineSignout) {
          try {
            window.electron.saveOfflineSignout({ userId: savedUser.userId });
            console.log("📁 Fallback: offline signout saved");
          } catch (e) {
            console.warn("⚠️ Failed to fallback-save offline:", e);
          }
        }
      }
    } else {
      if (window.electron?.saveOfflineSignout) {
        try {
          window.electron.saveOfflineSignout({ userId: savedUser.userId });
          console.log("📁 Offline signout saved locally");
        } catch (err) {
          console.warn("⚠️ Failed to save offline session:", err);
        }
      } else {
        console.warn("🧪 Not running in Electron — offline save skipped");
      }
    }
  }

  // Clear user session
  localStorage.removeItem("user");

  if (window.electron?.clearOfflineSignout) {
    try {
      window.electron.clearOfflineSignout();
    } catch (err) {
      console.warn("⚠️ Failed to clear offline sync:", err);
    }
  }

  // Redirect to signin page
  if (window.location.hash.includes("#")) {
    window.location.hash = "#/signin";
  } else {
    window.location.href = "/signin";
  }
};




  return (
    // User Profile
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Button */}
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

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 rounded-md shadow-lg ring-1 ring-gray-300 dark:ring-gray-600 ring-opacity-5 z-10">
          <ul className="py-1">
            <li>
              <Link
                to="/home/setting"
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

            <li onClick={handleSignout}
            className="flex items-center px-4 py-2 hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"> 
                <FaSignOutAlt className="mr-2" /> Sign Out

            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default StUserProfile;