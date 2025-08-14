import React from "react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import StNav from "../components/streamer_components/StNav";
import StSideBar from "../components/streamer_components/StSideBar";
import StSessionManager from "../components/streamer_components/StSessionManager";
import axios from "axios";
import { API } from "@/config/api";

const StreamerLayout = () => {
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    const handleUnload = async () => {
      if (savedUser?.userId) {
        try {
          await fetch(`${API}/api/auth/update-signout-time`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: savedUser.userId,
              time: new Date().toISOString(),
              reason: "auto",
            }),
          });
          console.log("📡 Auto signout time recorded");
        } catch (err) {
          console.error("🚫 Auto signout failed:", err);
        }
      }
    };

    const syncOfflineSignout = async () => {
      try {
        const sessionData = window.electron?.readOfflineSignout?.(); // Only works in Electron
        if (sessionData && savedUser?.userId === sessionData.userId) {
          await axios.post(`${API}/api/auth/update-signout-time`, {
            ...sessionData,
          });
          console.log("☁️ Synced offline signout to server");
          window.electron?.clearOfflineSignout?.(); // Clean up
        }
      } catch (err) {
        console.error("Sync failed:", err);
      }
    };

    if (!window.electron) {
      // For browser only
      window.addEventListener("beforeunload", handleUnload);
      return () => window.removeEventListener("beforeunload", handleUnload);
    } else {
      // For Electron only
      syncOfflineSignout();
    }
  }, []);

  return (
    <>
      <StSessionManager />
      <StNav />
      <StSideBar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default StreamerLayout;
