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
import StSendFeedbackPage from "./pages/streamerPages/StSendFeedbackPage";
import StFilterPage from "./pages/streamerPages/StFilterPage";

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
          </Route>

          {/* Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdDashboardPage />} />
            <Route path="videoHomePage" element={<AdVideoHomePage />} />
            <Route path="editProfile" element={<AdEditProfilePage />} />
            <Route path="manageUser" element={<AdUserManagePage />} />
            <Route path="view/:id" element={<AdUserDetails />} />
          </Route>
        </Routes>
      </HashRouter>
    </UserProvider>
  );
}

export default App;
