
import React from "react";
import AdSearchBar from "../../components/admin_components/AdSearchBar";
import AdSideButtons from "../../components/admin_components/AdSideButtons";
import AdNav from "../../components/admin_components/AdNav";
import AdMovieContent from "../../components/admin_components/AdMovieContent";



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
  );
};

export default AdVideoHomePage;
