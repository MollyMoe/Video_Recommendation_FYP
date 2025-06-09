import React from 'react'
import HomeContent from '../streamer_components/HomeContent'
import Nav from '../streamer_components/Nav';
import SideBar from '../streamer_components/SideBar';
import SearchBar from '../streamer_components/SearchBar';

const HomePage = () => {
  return (
    <div>
     
      <Nav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
      <SearchBar />
      </div>
      <SideBar />
      <HomeContent />
    </div>
  )
}

export default HomePage;
