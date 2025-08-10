import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StHomeContent from "../../components/streamer_components/StHomeContent";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";
import { API } from "@/config/api";

const StHomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const userId = savedUser?.userId;

  // ---- 1) Track online/offline (unconditional hook)
  useEffect(() => {
    const handleNetworkChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  // ---- 2) Fast paint from cached recs + session hop (unconditional hook)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const fn = window.electron?.getRecommendedMovies;
        if (typeof fn !== "function") {
          console.warn("getRecommendedMovies missing on bridge");
          if (!cancelled) setMovies([]);
        } else {
          const rec = await Promise.resolve(fn());
          if (!cancelled) setMovies(Array.isArray(rec) ? rec : []);
        }
      } catch (e) {
        console.error("Failed to load recs:", e);
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setIsLoading(false);

        // Home → Filter hop via sessionStorage flag
        const next = sessionStorage.getItem("pendingRouteAfterHome");
        if (!cancelled && next) {
          sessionStorage.removeItem("pendingRouteAfterHome");
          navigate(next, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ---- 3) Subscription effect (same logic as yours; runs before any return)
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchSubscription = async (uid) => {
      try {
        let subscription;

        if (isOnline) {
          const res = await fetch(`${API}/api/subscription/${uid}`);
          subscription = await res.json();

          // Save for offline use (as-is)
          window.electron?.saveSubscription?.(subscription);
        } else {
          // Your original: read last saved and accept if matches user
          const offlineSub = window.electron?.getSubscription?.();
          subscription = offlineSub?.userId === uid ? offlineSub : null;
        }

        if (!cancelled) setIsSubscribed(Boolean(subscription?.isActive));
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        if (!cancelled) setIsSubscribed(false); // fallback
      }
    };

    fetchSubscription(userId);
    return () => {
      cancelled = true;
    };
  }, [userId, isOnline]); // re-check on user or network change

  // ---- handlers
  const handleSearch = (query) => setSearchQuery(query);

  // ---- early return AFTER all hooks are declared
  if (isLoading) return <div>Loading Home…</div>;

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
        isSubscribed={isSubscribed}
      />
    </>
  );
};

export default StHomePage;
