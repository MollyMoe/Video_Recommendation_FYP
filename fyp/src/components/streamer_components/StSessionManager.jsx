import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/config/api";


const StSessionManager = () => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // ⏳ Check if total session exceeds 3 days (testing = 3 minutes)
  const checkSessionDuration = async () => {
    const signinTime = localStorage.getItem("signinTime");
    if (!signinTime) return;

    const threeMinutes = 3 * 60 * 1000;
    if (Date.now() - Number(signinTime) > threeMinutes) {
      await signoutUser("session-expired");
    }
  };

  // 🔒 Sign Out User (manual or timeout)
  const signoutUser = async (reason = "manual") => {
    const signoutTime = new Date().toISOString();

    // 1. Save to offline file
    const session = window.electron?.getSession?.();
    if (session) {
      window.electron.saveSession({
        ...session,
        lastSignout: signoutTime,
      });
    }

    // 2. Sync to backend (online only)
    if (navigator.onLine && savedUser?.userId && savedUser?.userType) {
      try {
        await axios.post(`${API}/api/auth/update-signout-time`, {
          userId: savedUser.userId,
          userType: savedUser.userType,
          time: signoutTime,
          reason,
        });
        console.log("✅ Synced sign-out time to backend");
      } catch (err) {
        console.warn("⚠️ Failed to sync sign-out:", err);
      }
    }

    // 3. Clear local session
    localStorage.removeItem("user");
    localStorage.removeItem("signinTime");
    localStorage.removeItem("admin_profileImage");
    localStorage.removeItem("streamer_profileImage");

    // 4. Redirect to login
    navigate("/signin");
  };

  useEffect(() => {
    localStorage.setItem("signinTime", Date.now().toString());

    // 5. Inactivity timeout (testing: 2 mins)
    let activityTimeout = setTimeout(() => signoutUser("inactivity"), 2 * 60 * 1000);

    const resetActivityTimer = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => signoutUser("inactivity"), 2 * 60 * 1000);
    };

    // 6. Attach listeners
    window.addEventListener("mousemove", resetActivityTimer);
    window.addEventListener("keydown", resetActivityTimer);
    window.addEventListener("touchstart", resetActivityTimer);

    // 7. Start timers
    resetActivityTimer();
    checkSessionDuration();

    // 8. Cleanup on unmount
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
