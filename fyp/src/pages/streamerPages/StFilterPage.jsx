import React, { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StFilterContent from "../../components/streamer_components/StFilterContent";
import StFilterBar from "../../components/streamer_components/StFilterBar";
import { API } from "@/config/api";

const StFilterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userId = JSON.parse(localStorage.getItem("user"))?.userId;

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API}/api/subscription/${userId}`);
      const data = await res.json();
      setIsSubscribed(data.isActive);
    } catch (err) {
      console.error("❌ Failed to check subscription:", err);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubscription();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <StNav />
        <StSideBar />
        <div className="sm:ml-64 flex items-center justify-center h-screen dark:bg-gray-900 text-center px-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
              🔒 This feature is locked
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please subscribe to unlock the advanced filtering feature.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ✅ If subscribed, render full content
  return (
     <>
      <StNav />
      <StSideBar />
      <div className="fixed top-[80px] left-20 w-full h-35 flex justify-center px-4 z-30 bg-white dark:bg-gray-800">
        <div className="w-full max-w-sm flex flex-col justify-center">
          <StFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>
      </div>

      <div className="sm:ml-64 px-4">
        <StFilterContent searchQuery={searchQuery} userId={userId} />
      </div>
    </>
  );
};

export default StFilterPage;