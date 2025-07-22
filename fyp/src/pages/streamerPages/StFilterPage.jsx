import React, { useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StFilterContent from "../../components/streamer_components/StFilterContent";
import StFilterBar from "../../components/streamer_components/StFilterBar";

const StFilterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <>
      <StNav />
      <div className="top-[85px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5 
      fixed bg-white dark:bg-gray-800 ">
        <StFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />
      </div>
      <StSideBar />
      <StFilterContent searchQuery={searchQuery} userId={JSON.parse(localStorage.getItem("user"))?.userId} />
    </>
  );
};

export default StFilterPage;