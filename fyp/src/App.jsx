import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import StHomePage from "./pages/streamerPages/StHomePage";
import InputGenrePage from './pages/InputGenrePage';
import AdminLayout from './layouts/AdminLayout';
import StHistoryPage from "./pages/streamerPages/StHistoryPage";
import Signin from './pages/SignInPage';
import Signup from './pages/SignUpPage';
import ResetPassword from './pages/ResetPasswordPage';
import StSettingPage from "./pages/streamerPages/StSettingPage";
import StreamerLayout from "./layouts/StreamerLayout";
import AdDashboard from "./components/admin_components/AdDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Signin />,
  },
  
  {
    path: "/home",
    element: <StreamerLayout />,
    children: [
      {
        index: true,
        element: <StHomePage />,
      },
      {
        path: "history",
        element: <StHistoryPage />,
      },
      {
        path: "setting",
        element: <StSettingPage />,
      }
    ],
  },
  // Admin Layout
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdDashboard />,
      },
    ],
  },
  {
    path: "/inputgenre",
    element: <InputGenrePage />,
  },
  {
    path: "/signin",
    element: <Signin />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
]);


function App() {
  return <RouterProvider router={router} />
}

export default App;
