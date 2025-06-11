import React from 'react'
import { Link } from "react-router-dom";

const AdDashboard = () => {
  return (
    <div className="p-4">
      <div className="mt-25 text-xl font-bold mb-4 text-center">AdDashboard</div>
<<<<<<< HEAD

=======
      
>>>>>>> cc047ee2691cf7fb9d28f39c7b88e775f41c3f05
      <div className="mt-16 flex justify-center">
        <div className="grid grid-cols-2 gap-8">
          <Link to="/admin/videoHomePage">
            <div className="bg-gray-200 p-6 rounded shadow text-center hover:bg-gray-300 cursor-pointer">
              Video Manage
            </div>
          </Link>

<<<<<<< HEAD
          <Link to="/admin/AdVideoHomePage">
=======
          <Link to="/admin/manageUser">
>>>>>>> cc047ee2691cf7fb9d28f39c7b88e775f41c3f05
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