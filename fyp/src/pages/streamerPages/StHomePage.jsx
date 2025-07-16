import React, { useState } from "react";
import StHomeContent from "../../components/streamer_components/StHomeContent";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

const StHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <>
      <StNav />
      <div className="fixed top-[20px] left-4/7 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />
      </div>
      <StSideBar />
      <StHomeContent searchQuery={searchQuery} userId={JSON.parse(localStorage.getItem("user"))?.userId} />
    </>
  );
};

export default StHomePage;