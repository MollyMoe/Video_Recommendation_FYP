import React from 'react'
import { Link, useLocation } from 'react-router-dom';

const SidebarButton = ({ to, label, current }) => {
  return (
    <Link
      to={to}
      className={`block p-4 rounded-lg ${
        current ? 'bg-gray-200 text-black font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </Link>
  );
};
export default SidebarButton