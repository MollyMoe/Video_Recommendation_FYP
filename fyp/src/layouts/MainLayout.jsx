import React from 'react';
import Nav from '../components/Nav';
import SideBar from '../components/SideBar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <>
      <Nav />
      <SideBar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;