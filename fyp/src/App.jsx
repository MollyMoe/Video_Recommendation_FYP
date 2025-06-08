import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import InputGenrePage from './pages/InputGenrePage';
import AdminLayout from './layouts/AdminLayout';
import HistoryPage from './pages/HistoryPage';
import Signin from './pages/SignInPage';
import Signup from './pages/SignUpPage';
import ResetPassword from './pages/ResetPasswordPage';
import SettingPage from './pages/SettingPage';
import StreamerLayout from "./layouts/StreamerLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <StreamerLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "setting",
        element: <SettingPage />,
      }
    ],
  },
  // Admin Layout
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
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
