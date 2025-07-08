
import React from "react";
import AdSearch from "../../components/admin_components/AdSearch";
import AdSideButtons from "../../components/admin_components/AdSideButtons";
import AdNav from "../../components/admin_components/AdNav";
import AdMovieContent from "../../components/admin_components/AdMovieContent";
import { useState } from "react";


const AdVideoHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
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
      <AdMovieContent searchQuery={searchQuery} />
    </>
  );
};

export default AdVideoHomePage;
