
import { HashRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import StHomePage from "./pages/streamerPages/StHomePage";
import InputGenrePage from "./pages/InputGenrePage";
import AdminLayout from "./layouts/AdminLayout";
import StHistoryPage from "./pages/streamerPages/StHistoryPage";
import Signin from "./pages/SignInPage";
import Signup from "./pages/SignUpPage";
import StSettingPage from "./pages/streamerPages/StSettingPage";
import StreamerLayout from "./layouts/StreamerLayout";
import AdDashboardPage from "./pages/adminPages/AdDashboardPage";
import AdVideoHomePage from "./pages/adminPages/AdVideoHomePage";
import AdEditProfilePage from "./pages/adminPages/AdEditProfilePage";
import AdUserManagePage from "./pages/adminPages/AdUserManagePage";
import AdUserDetails from "./components/admin_components/AdUserDetails";
import SetNewPasswordPage from "./pages/SetNewPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StLikedMoviesPage from "./pages/streamerPages/StLikedMoviesPage";
import StWatchLaterPage from "./pages/streamerPages/StWatchLaterPage";
import StHelpPage from "./pages/streamerPages/StHelpPage";
import StManageSubscriptionPage from "./pages/streamerPages/StManageSubscriptionPage";
import StPaymentSuccess from "./pages/streamerPages/StPaymentSuccess";
import StFilterPage from "./pages/streamerPages/StFilterPage";
import StSendFeedbackPage from "./pages/streamerPages/StSendFeedbackPage";
import AdTopLikedPage from "./pages/adminPages/AdTopLikedPage";
import AdVideoManageLayout from "./layouts/AdVideoManageLayout";
import AdUserDetailsLayout from "./layouts/AdUserDetailsLayout";
import AdUserOverview from "./pages/adminPages/AdUserOverview";
import { Navigate } from "react-router-dom";
import AdUserLikedMoviesPage from "./pages/adminPages/AdUserLikedMoviesPage";
import AdUserWatchLaterPage from "./pages/adminPages/AdUserWatchLaterPage";
import AdUserHistoryPage from "./pages/adminPages/AdUserHistoryPage";
import AdRecentlyAddedMovies from "./components/admin_components/AdRecentlyAddedMovies";
import AdUserFeedback from "./components/admin_components/AdUserFeedback";
import AdVideoManageGenrePage from "./pages/adminPages/AdVideoManageGenrePage";
import AdSuspensionDetailPage from "./pages/adminPages/AdSuspensionDetailPage";
import { API } from "./config/api";
import { useEffect } from "react";


function App() {
  useEffect(() => {
    function handleOnline() {
      const queued = window.electron?.getFeedbackQueue?.() || [];

      if (queued.length > 0) {
        queued.forEach((item) => {
          fetch(`${API()}/api/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
            .then(res => res.json())
            .then(data => {
              console.log("✅ Sent queued feedback:", data);
            })
            .catch(err => {
              console.error("❌ Failed to send queued feedback item:", err);
            });
        });

        window.electron?.clearFeedbackQueue?.();
      }
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <UserProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/inputgenre" element={<InputGenrePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password-form" element={<SetNewPasswordPage />} />
          <Route path="/success" element={<StPaymentSuccess />} />

          {/* Streamer Layout */}
          <Route path="/home" element={<StreamerLayout />}>
            <Route index element={<StHomePage />} />
            <Route path="history" element={<StHistoryPage />} />
            <Route path="setting" element={<StSettingPage />} />
            <Route path="like" element={<StLikedMoviesPage />} />
            <Route path="watchLater" element={<StWatchLaterPage />} />
            <Route path="filter" element={<StFilterPage />} />
            <Route path="help" element={<StHelpPage />} />
            <Route path="sendfeedback" element={<StSendFeedbackPage />} />
            <Route path="subscription" element={<StManageSubscriptionPage />} />
          </Route>

          {/* Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdDashboardPage />} />
            <Route path="videoHomePage" element={<AdVideoHomePage />} />
            <Route path="editProfile" element={<AdEditProfilePage />} />
            <Route path="manageUser" element={<AdUserManagePage />} />
            <Route path="feedback" element={<AdUserFeedback />} />
            
              {/* Video Manage Layout */}
              <Route path="video" element={<AdVideoManageLayout />}>
                <Route index element={<Navigate to="videoHomePage" replace />} />
                <Route path="videoHomePage" element={<AdVideoHomePage />} />
                <Route path="manage" element={<AdTopLikedPage />} />
                <Route path="genre" element={<AdVideoManageGenrePage />} />
                <Route path="recently-added" element={<AdRecentlyAddedMovies />} />
              </Route>

              <Route path="/admin/view/:id" element={<AdUserDetailsLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<AdUserOverview />} />
                <Route path="subscription" element={<AdUserDetails />} />
                <Route path="suspension" element={<AdSuspensionDetailPage />} />
                <Route path="history" element={<AdUserHistoryPage />} />
                <Route path="liked" element={<AdUserLikedMoviesPage />} />
                <Route path="watchLater" element={<AdUserWatchLaterPage/>} />
              </Route>
          </Route>
        </Routes>
      </HashRouter>
    </UserProvider>
  );
}

export default App;
