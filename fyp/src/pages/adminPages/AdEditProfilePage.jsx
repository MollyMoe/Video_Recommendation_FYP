import React from 'react'
import { Link } from 'react-router-dom'

const AdEditProfilePage = () => {

    const SideButton = ({ to, label, current, children }) => {
      return (
        <Link
          to={to}
          className={`block p-1 rounded-lg ${
            current ? 'bg-gray-200 text-black font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {children || label}
        </Link>
      );
    };

  return (
    <div>

        <div className="fixed top-20 left-5 h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
            <button className="bg-white border border-gray-400 text-black text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                <SideButton to="/admin" label="Back" current={location.pathname === '/admin'} />    
            </button>

        </div>
        
    </div>
  )
}

export default AdEditProfilePage