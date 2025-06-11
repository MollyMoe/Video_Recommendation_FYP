import React from "react";
import { Link } from "react-router-dom";

const AdDashboard = () => {
  return (
    <div className="min h-screen p-4 dark:text-white dark:bg-gray-800">
      <div className="mt-25 text-xl font-bold mb-4 text-center dark:text-white dark:bg-gray-800">
        AdDashboard
      </div>

      <div className="mt-16 flex justify-center dark:text-white dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-8 ">
          <Link to="/admin/videoHomePage">
            <div className="bg-gray-200 p-6 rounded shadow text-center hover:bg-gray-300 cursor-pointer dark:text-gray-800 dark:bg-gray-200 dark:hover:bg-white">
              Video Manage
            </div>
          </Link>

          <Link to="/admin/manageUser">
            <div className="bg-blue-200 p-6 rounded shadow text-center hover:bg-blue-300 cursor-pointer dark:text-gray-800">
              User Manage
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdDashboard;
