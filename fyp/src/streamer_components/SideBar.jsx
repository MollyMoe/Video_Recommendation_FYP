import React from 'react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import SidebarButton from './SidebarButton';

const SideBar = () => {
  const location = useLocation();
  return (
    <aside
      id="logo-sidebar"
      className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <ul className="space-y-2 font-medium text-center text-black dark:text-white">
  <li>
    <SidebarButton to="/" label="Home" current={location.pathname === '/'} />
  </li>

  <hr className="my-2 border-gray-300" />

  <li>
    <SidebarButton to="/history" label="History" current={location.pathname === '/history'} />
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Watch Later
    </a>
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Liked Videos
    </a>
  </li>

  <hr className="my-2 border-gray-300" />

  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Hide Recommendations
    </a>
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Regenerate Recommendations
    </a>
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Filter Recommendations
    </a>
  </li>

  <hr className="my-2 border-gray-300" />
  
  <li>
    <SidebarButton to="/setting" label="Setting" current={location.pathname === '/setting'} />
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Help
    </a>
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Send Feedback
    </a>
  </li>
  <li>
    <a
      href="#"
      className="block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Manage Subscriptions
    </a>
  </li>
</ul>

      </div>

    </aside>
  );
};


export default SideBar