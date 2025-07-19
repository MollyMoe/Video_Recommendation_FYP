// SessionManager.jsx
import { useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const StSessionManager = () => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  // Check if 3 days have passed since login
  const checkSessionTimeout = async () => {
    const signinTime = localStorage.getItem("signinTime");
    if (!signinTime) return;

    // const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
     const threeDays = 3 * 24 * 60  * 60 * 1000;
    if (Date.now() - Number(signinTime) > threeDays) {
      await signoutUser("timeout");
    }
  };

  // Sign Out and track time
  const signoutUser = async (reason = "manual") => {
    if (savedUser?.userId) {
      try {
        await axios.post(`${API}/api/auth/update-signout-time`, {
          userId: savedUser.userId,
          time: new Date().toISOString(),
          reason,
        });
      } catch (err) {
        console.error("Failed to record signout time:", err);
      }
    }

    localStorage.removeItem("user");
    localStorage.removeItem("signinTime");
    window.location.href = "/login";
  };

  // Track user activity for session timeout
  let activityTimeout;
  const resetActivityTimer = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => signoutUser("timeout"),2 * 60 * 1000); // 3 days inactivity
  };

  useEffect(() => {
    localStorage.setItem("signinTime", Date.now().toString());

    window.addEventListener("mousemove", resetActivityTimer);
    window.addEventListener("keydown", resetActivityTimer);
    window.addEventListener("touchstart", resetActivityTimer);

    resetActivityTimer(); // start timer
    checkSessionTimeout(); // check on load

    return () => {
      clearTimeout(activityTimeout);
      window.removeEventListener("mousemove", resetActivityTimer);
      window.removeEventListener("keydown", resetActivityTimer);
      window.removeEventListener("touchstart", resetActivityTimer);
    };
  }, []);

  return null;
};

export default StSessionManager;
