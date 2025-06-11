import React from 'react'
import AdSearchBar from '../../components/admin_components/AdSearchBar'
<<<<<<< HEAD
import AdNav from '../../components/admin_components/AdNav'
=======
import AdSideButtons from '../../components/admin_components/AdSideButtons'
import AdNav from '../../components/admin_components/AdNav'
import AdMovieContent from '../../components/admin_components/AdMovieContent'
>>>>>>> cc047ee2691cf7fb9d28f39c7b88e775f41c3f05

const AdVideoHomePage = () => {
  return (
    
    <>
    <AdNav />
    <AdSideButtons />
    <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
    <AdSearchBar />
    </div>
    <AdMovieContent />
    </>
  )
}

export default AdVideoHomePage