import React from 'react'
import Nav from '../components/streamer_components/Nav';
import SideBar from '../components/streamer_components/SideBar';
import { Outlet } from 'react-router-dom';

const StreamerLayout = () => {
  return (
    <>
      <Nav />
      <SideBar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default StreamerLayout