import React from 'react';
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