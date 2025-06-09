import React from 'react'
import { Link, useLocation } from 'react-router-dom';

const StSidebarButton = ({ to, label, current, children }) => {
  return (
    <Link
      to={to}
      className={`block p-4 rounded-lg ${
        current ? 'bg-gray-200 text-black font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children || label}
    </Link>
  );
};

export default StSidebarButton