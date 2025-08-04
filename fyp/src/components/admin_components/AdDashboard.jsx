
import React from "react";
import { Link } from "react-router-dom";
import AdminUserManage from "../../images/AdminUserManage.png";
import AdminVideoManage from "../../images/AdminVideoManage.png";
import AdminBoard from "../../images/AdminBoard.png";

const AdDashboard = () => {
  return (
    <div className="min h-screen p-4 dark:text-white dark:bg-gray-800">
      <div className="mt-25 text-3xl font-bold mb-4 text-center dark:text-white dark:bg-gray-800">
        Welcome Back!
      </div>
      <div className="flex flex-col items-center">
        <img src={AdminBoard} alt="Video Icon" className="w-50 h-50 scale-300 mt-20"/>
      </div>

      <div className="mt-16 flex justify-center dark:text-white dark:bg-gray-800">
      <div className="grid grid-cols-2 gap-8">
        
        <Link to="/admin/manageUser">
          <div className="bg-neutral-50 px-20 py-6 rounded shadow-md text-center hover:bg-gray-300 cursor-pointer dark:text-gray-800 dark:bg-gray-200 dark:hover:bg-white">
            <h3 className="text-lg mb-2">Manage User Profile</h3>
            <div className="flex flex-col items-center">
              <img
                src={AdminVideoManage}
                alt="User Icon"
                className="w-24 h-24 mt-2 scale-300"
              />

            </div>
          </div>
        </Link>


        <Link to="/admin/video/videoHomePage">
          <div className="bg-neutral-50 px-20 py-4 rounded shadow-md text-center hover:bg-gray-300 cursor-pointer dark:text-gray-800 dark:bg-gray-200 dark:hover:bg-white">
            <h3 className="text-lg mb-2 mt-2">Manage Video Content</h3>
            <div className="flex flex-col items-center">
              <img
                src={AdminUserManage}
                alt="Video Icon"
                className="w-24 h-24 mt-4 scale-230"
              />
            </div>
          </div>
        </Link>

      </div>
    </div>

    </div>
    );
};


export default AdDashboard;
