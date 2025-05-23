import React from 'react'
import HomeContent from '../components/HomeContent'
import Nav from '../components/Nav';
import SideBar from '../components/SideBar';

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
