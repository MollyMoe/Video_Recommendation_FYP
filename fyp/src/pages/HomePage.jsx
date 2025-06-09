import React from 'react'
import HomeContent from '../streamer_components/HomeContent'
import Nav from '../streamer_components/Nav';
import SideBar from '../streamer_components/SideBar';

const HomePage = () => {
  return (
    <div>
      <Nav />
      <SideBar />
      <HomeContent />
    </div>
  )
}

export default HomePage;
