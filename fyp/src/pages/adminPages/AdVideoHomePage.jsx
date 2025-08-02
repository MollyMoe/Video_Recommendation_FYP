import React, { useState } from "react";
import { useOutletContext } from "react-router-dom"; // Import useOutletContext
import AdSearch from "../../components/admin_components/AdSearch";
import AdMovieContent from "../../components/admin_components/AdMovieContent";
import AdSideButtons from "../../components/admin_components/AdSideButtons";
import AdNav from "../../components/admin_components/AdNav";

const AdVideoHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
    const context = useOutletContext();

  // Get all context values from AdVideoManageLayout
    // Safely destructure context with default values
  const {
    recentMoviesGlobal = [],
    setRecentMoviesGlobal = () => {},
    updateFlag = false
  } = context || {};

  return (
    <>
      <AdNav />
      <AdSideButtons />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <AdSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(value) => setSearchQuery(value)}
        />
      </div>
      <AdMovieContent
        searchQuery={searchQuery}
        externalUpdateTrigger={updateFlag} 
        setRecentMoviesGlobal={setRecentMoviesGlobal} 
        currentRecentMoviesGlobal={recentMoviesGlobal} 
      />
    </>
  );
};
export default AdVideoHomePage;