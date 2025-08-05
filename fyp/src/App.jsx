import { HashRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";

import StHomePage from "./pages/streamerPages/StHomePage";
import InputGenrePage from "./pages/InputGenrePage";
import AdminLayout from "./layouts/AdminLayout";
import AdVideoManageLayout from "./layouts/AdVideoManageLayout";

import StHistoryPage from "./pages/streamerPages/StHistoryPage";
import Signin from "./pages/SignInPage";
import Signup from "./pages/SignUpPage";
import StSettingPage from "./pages/streamerPages/StSettingPage";
import StreamerLayout from "./layouts/StreamerLayout";

import AdDashboardPage from "./pages/adminPages/AdDashboardPage";
import AdVideoHomePage from "./pages/adminPages/AdVideoHomePage";
import AdEditProfilePage from "./pages/adminPages/AdEditProfilePage";
import AdUserManagePage from "./pages/adminPages/AdUserManagePage";
import AdTopLikedPage from "./pages/adminPages/AdTopLikedPage";
import AdVideoManageGenrePage from "./pages/adminPages/AdVideoManageGenrePage";
import AdUserDetails from "./components/admin_components/AdUserDetails";
import AdRecentlyAddedMovies from "./components/admin_components/AdRecentlyAddedMovies";
import AdUserDetailsLayout from "./layouts/AdUserDetailsLayout";
import AdUserOverviewPage from "./pages/adminPages/AdUserOverviewPage";
import AdUserLikedMoviesPage from "./pages/adminPages/AdUserLikedMoviesPage";
import AdUserWatchLaterPage from "./pages/adminPages/AdUserWatchLaterPage";
import AdUserHistoryPage from "./pages/adminPages/AdUserHistoryPage";


import SetNewPasswordPage from "./pages/SetNewPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StLikedMoviesPage from "./pages/streamerPages/StLikedMoviesPage";
import StWatchLaterPage from "./pages/streamerPages/StWatchLaterPage";
import StHelpPage from "./pages/streamerPages/StHelpPage";
import StFilterPage from "./pages/streamerPages/StFilterPage";
import StSendFeedbackPage from "./pages/streamerPages/StSendFeedbackPage"; 
import StManageSubscriptionPage from "./pages/streamerPages/StManageSubscriptionPage";
import StPaymentSuccessPage from "./pages/streamerPages/StPaymentSuccessPage";

import StManageSubscriptionPage from "./pages/streamerPages/StManageSubscription";
import StPaymentSuccess from "./pages/streamerPages/StPaymentSuccess";
import StFilterPage from "./pages/streamerPages/StFilterPage";
import StSendFeedbackPage from "./pages/streamerPages/StSendFeedbackPage";
import AdVideoManagePage from "./pages/adminPages/AdVideoManagePage";
import AdVideoManageLayout from "./layouts/AdVideoManageLayout";
import AdUserDetailsLayout from "./layouts/AdUserDetailsLayout";
import Overview from "./pages/adminPages/Overview";
import { Navigate } from "react-router-dom";
import AdUserLikedMovies from "./pages/adminPages/AdUserLikedMovies";
import AdUserWatchLater from "./pages/adminPages/AdUserWatchLater";
import AdUserHistory from "./pages/adminPages/AdUserHistory";
import AdRecentlyAddedMovies from "./components/admin_components/AdRecentlyAddedMovies";
import AdUserFeedback from "./components/admin_components/AdUserFeedback";


function App() {

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
          <Route path="/success" element={<StPaymentSuccessPage />} />
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
            <Route path="editProfile" element={<AdEditProfilePage />} />
            <Route path="manageUser" element={<AdUserManagePage />} />
            <Route path="feedback" element={<AdUserFeedback />} />
            
              {/* Video Manage Layout */}
              <Route path="video" element={<AdVideoManageLayout />}>
                <Route index element={<Navigate to="videoHomePage" replace />} />
                <Route path="videoHomePage" element={<AdVideoHomePage />} />
                <Route path="manage" element={<AdVideoManagePage />} />
                <Route path="recently-added" element={<AdRecentlyAddedMovies />} />
              </Route>

              <Route path="/admin/view/:id" element={<AdUserDetailsLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="subscription" element={<AdUserDetails />} />
                <Route path="history" element={<AdUserHistory />} />
                <Route path="liked" element={<AdUserLikedMovies />} />
                <Route path="watchLater" element={<AdUserWatchLater/>} />
              </Route>
            
            <Route path="video" element={<AdVideoManageLayout />}>
              <Route index element={<Navigate to="videoHomePage" replace />} />
              <Route path="videoHomePage" element={<AdVideoHomePage />} />
              <Route path="manage" element={<AdTopLikedPage />} />
              <Route path="genre" element={<AdVideoManageGenrePage />} />
              <Route path="recently-added" element={<AdRecentlyAddedMovies />} />
            </Route>

            <Route path="/admin/view/:id" element={<AdUserDetailsLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<AdUserOverviewPage />} />
                <Route path="subscription" element={<AdUserDetails />} />
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