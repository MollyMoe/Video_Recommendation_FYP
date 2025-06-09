import React from 'react'
import Nav from '../components/streamer_components/StNav';
import SideBar from '../components/streamer_components/StSideBar';
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