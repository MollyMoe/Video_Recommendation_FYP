import React from 'react';
import Nav from '../streamer_components/Nav';
import SideBar from '../streamer_components/SideBar';
import { Outlet } from 'react-router-dom';
import Dashboard from '../admin_components/Dashboard';

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