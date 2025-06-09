import React from 'react'
import HomeContent from '../../components/streamer_components/StHomeContent'
import Nav from '../../components/streamer_components/StNav';
import SideBar from '../../components/streamer_components/StSideBar';
import SearchBar from '../../components/streamer_components/StSearchBar';

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
