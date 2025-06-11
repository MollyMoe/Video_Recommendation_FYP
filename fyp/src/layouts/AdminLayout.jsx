import React from 'react';
import { Outlet } from 'react-router-dom';
<<<<<<< HEAD
=======
import AdDashboard from '../components/admin_components/AdDashboard';
>>>>>>> cc047ee2691cf7fb9d28f39c7b88e775f41c3f05
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