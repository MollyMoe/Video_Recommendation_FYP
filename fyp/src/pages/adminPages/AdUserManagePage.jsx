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
          <div className="py-4 overflow-y-auto"> 
            <ul className="space-y-2 font-medium"> 
              <li>
                <Link to="/admin">
                  <button className="flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 group w-full text-left">
                    <span className="ml-3">Home</span>
                  </button>
                </Link>
              </li>
              <li>
                <Link to="/admin/feedback">
                  <button className="flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 group w-full text-left">
                    <span className="ml-3">Feedback</span>
                  </button>
                </Link>
              </li>
            </ul>
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
