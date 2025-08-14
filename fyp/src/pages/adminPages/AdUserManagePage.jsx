import React, { useState, useEffect } from "react";
import AdNav from "../../components/admin_components/AdNav";
import AdUserSearchBar from "../../components/admin_components/AdUserSearchBar";
import { Link } from "react-router-dom";
import AdUserTable from "../../components/admin_components/AdUserTable";
import { useLocation } from "react-router-dom";
import { House, Newspaper } from "lucide-react";

const AdUserManagePage = () => {
  const location = useLocation();
  const restoredQuery = location.state?.searchQuery || "";
  const [searchQuery, setSearchQuery] = useState(restoredQuery);
  return (
    <>
      <AdNav />

      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <AdUserSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(value) => setSearchQuery(value)}
        />

      </div>
      <div>
        <aside className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 bg-white/70 dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 pb-4 overflow-y-auto mt-2 space-y-2">
              
            {/* Home Link */}
            <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2 text-gray-800 hover:bg-fuchsia-200 dark:text-white dark:hover:bg-gray-700 rounded-lg"
              >
              <House className="w-4 h-4" />
                Home
            </Link>

            {/* Feedback Link */}
            <Link
                to="/admin/feedback"
                className="flex items-center gap-3 px-3 py-2 text-gray-800 hover:bg-fuchsia-200 dark:text-white dark:hover:bg-gray-700 rounded-lg"
              >
              <Newspaper className="w-4 h-4" />
                Feedback
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