
import React, { useState, useEffect } from "react";
import StHomeContent from "../../components/streamer_components/StHomeContent";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { API } from "@/config/api";

const StHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
    
  
    useEffect(() => {
      const handleNetworkChange = () => setIsOnline(navigator.onLine);
      window.addEventListener("online", handleNetworkChange);
      window.addEventListener("offline", handleNetworkChange);
      return () => {
        window.removeEventListener("online", handleNetworkChange);
        window.removeEventListener("offline", handleNetworkChange);
      };
    }, []);


  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const fetchSubscription = async (userId) => {
    try {
      let subscription;
  
      if (isOnline) {
        const res = await fetch(`${API}/api/subscription/${userId}`);
        subscription = await res.json();
        console.log("🔑 Online subscription data:", subscription);
  
        // Save for offline use (entire object)
        window.electron?.saveSubscription(subscription);
      } else {
        const offlineSub = window.electron?.getSubscription();
        subscription = offlineSub?.userId === userId ? offlineSub : null;
        console.log("📦 Offline subscription data:", subscription);
      }
  
      setIsSubscribed(Boolean(subscription?.isActive));
      console.log("✅ isOnline:", isOnline);
      console.log("✅ isSubscribed:", isSubscribed, typeof isSubscribed);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setIsSubscribed(false); // fallback
    }
  };

  useEffect(() => {
  if (userId) fetchSubscription(userId);
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
