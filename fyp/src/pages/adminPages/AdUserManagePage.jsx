import React, { useState, useEffect } from "react";
import AdNav from "../../components/admin_components/AdNav";
import AdSearch from "../../components/admin_components/AdSearch";
import { Link } from "react-router-dom";
import AdUserTable from "../../components/admin_components/AdUserTable";
import { useLocation } from "react-router-dom";

const AdUserManagePage = () => {
  const location = useLocation();
  const restoredQuery = location.state?.searchQuery || "";
  const [searchQuery, setSearchQuery] = useState(restoredQuery);
  return (
    <>
      <AdNav />

      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <AdSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(value) => setSearchQuery(value)}
        />

      </div>
      <div>
        <aside
          id="logo-sidebar"
          className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
          aria-label="Sidebar"
        >
          <div className="min-h-screen flex-1 pt-20 pl-[160px] pr-6 dark:bg-gray-800">

            <Link to="/admin">
              <button className="fixed bg-white border border-gray-400 text-black top-17 left-10 text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                Home
              </button>
            </Link>
          </div>
        </aside>
      </div>
      <div className=" min h-screen flex-1 pt-20 pl-[120px] dark:bg-gray-800">
        <AdUserTable searchQuery={searchQuery} />
      </div>
    </>
  );
};

export default AdUserManagePage;
