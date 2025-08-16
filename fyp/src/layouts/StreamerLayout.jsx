
import React from "react";
import StNav from "../components/streamer_components/StNav";
import StSideBar from "../components/streamer_components/StSideBar";
import { Outlet } from "react-router-dom";

const StreamerLayout = () => {
  return (
    <>
      <StNav />
      <StSideBar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default StreamerLayout;
