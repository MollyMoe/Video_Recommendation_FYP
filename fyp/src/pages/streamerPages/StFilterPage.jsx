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
      <StSideBar />
      <div className="sm:ml-64 p-8 pt-20 bg-gray-900 min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-lg mb-8">
            <StFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
            />
          </div>
        </div>
        <StFilterContent searchQuery={searchQuery} />
      </div>
    </>
  );
};

export default StFilterPage;