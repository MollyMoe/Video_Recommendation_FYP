import React from "react";
import StHomeContent from "../../components/streamer_components/StHomeContent";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

const StHomePage = () => {
  return (
    <>
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
      <StHomeContent />
    </>
  );
};

export default StHomePage;
