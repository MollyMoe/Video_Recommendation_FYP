import React from 'react';
import Nav from '../components/streamer_components/StNav';
import SideBar from '../components/streamer_components/StSideBar';
import { Outlet } from 'react-router-dom';
import Dashboard from '../components/admin_components/AdDashboard';

const AdminLayout = () => {
  return (
    <>
      <Dashboard />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;