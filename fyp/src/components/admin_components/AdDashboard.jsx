import React from 'react'
import { Link } from "react-router-dom";

const AdDashboard = () => {
  return (
    <div className="p-4">
      <div className="mt-25 text-xl font-bold mb-4 text-center">AdDashboard</div>
      
      <div className="mt-16 flex justify-center">
        <div className="grid grid-cols-2 gap-8">
          <Link to="/admin/videoHomePage">
            <div className="bg-gray-200 p-6 rounded shadow text-center hover:bg-gray-300 cursor-pointer">
              Video Manage
            </div>
          </Link>

          <Link to="/admin/manageUser">
            <div className="bg-blue-200 p-6 rounded shadow text-center hover:bg-blue-300 cursor-pointer">
              User Manage
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdDashboard