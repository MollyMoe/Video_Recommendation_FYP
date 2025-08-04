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




import { Navigate } from "react-router-dom";
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
            <Route path="view/:id" element={<AdUserDetails />} />
            
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