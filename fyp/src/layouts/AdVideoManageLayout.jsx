// AdVideoManageLayout.jsx
import React, {useState} from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import AdSideButtons from "../components/admin_components/AdSideButtons";


const tabs = [
  { label: "All Movies", path: "/admin/video/videoHomePage" },
  { label: "Top Liked", path: "/admin/video/manage" },
  { label: "Genres", path: "/admin/video/genre" },
  { label: "Recently Added", path: "/admin/video/recently-added" }, //need to add in 
];

const AdVideoManageLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [updateFlag, setUpdateFlag] = useState(0); // default 0


  return (
    <>
      <AdSideButtons />
      <div className="p-6 dark:bg-gray-900 min-h-screen mt-20 ml-40">
        <div className="flex justify-center mb-8 space-x-4">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                currentPath === tab.path
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Dynamic page content renders here */}
        <Outlet context={{ updateFlag }} />
      </div>
    </>
  );
};

export default AdVideoManageLayout;