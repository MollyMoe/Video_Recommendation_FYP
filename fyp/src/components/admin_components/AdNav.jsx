import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { FaMoon, FaSignOutAlt, FaUserEdit, FaSearch } from "react-icons/fa";
import logoPic from "../../images/Cine-It.png";
import AdUserProfile from "./AdUserProfile";

const AdNav = () => {
  const [open, setOpen] = useState(false);
  const { setCurrentRole } = useUser();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userType) {
      setCurrentRole(savedUser.userType); // 'admin' or 'streamer'
    }
  }, [setCurrentRole]);

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center justify-start rtl:justify-end">
            <img
              className="w-33 h-15 rounded-full"
              src={logoPic}
              alt="Cine-It Logo"
            />
          </div>

          {/* Profile Dropdown */}
          <AdUserProfile />
        </div>
      </div>
    </nav>
  );
};

export default AdNav;