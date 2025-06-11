import React from 'react';
import Nav from '../components/streamer_components/StNav';
import SideBar from '../components/streamer_components/StSideBar';
import { Outlet } from 'react-router-dom';
import AdDashboard from '../components/admin_components/AdDashboard';
import AdNav from '../components/admin_components/AdNav';

const AdminLayout = () => {
  return (
    <>
      <AdNav />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;