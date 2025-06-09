import React from 'react'
import AutoRedirector from '../components/AutoDirector';
import Nav from '../streamer_components/Nav';
import SideBar from '../streamer_components/SideBar';
import { Outlet } from 'react-router-dom';

const StreamerLayout = () => {
  return (
    <>
    <AutoRedirector roleRequired="streamer" />
      <Nav />
      <SideBar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default StreamerLayout