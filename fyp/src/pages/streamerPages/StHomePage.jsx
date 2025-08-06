import React, { useState, useEffect } from "react";
import axios from "axios";
import StHomeContent from "../../components/streamer_components/StHomeContent";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

const API = import.meta.env.VITE_API_BASE_URL;

const StHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API}/api/subscription/${userId}`);
        setIsSubscribed(res.data?.isActive);
      } catch (err) {
        console.error("❌ Failed to check subscription", err);
        setIsSubscribed(false); // fallback
      }
    };
    fetchSubscription();
  }, [userId]);

  return (
    <>
      <StNav />
      <div className="fixed top-[20px] left-4/7 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          isSubscribed={isSubscribed}
        />
      </div>
      <StSideBar />
      <StHomeContent 
        searchQuery={searchQuery} 
        userId={userId}
        isSubscribed={isSubscribed} />
    </>
  );
};

export default StHomePage;
