import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import InputGenrePage from './pages/InputGenrePage';
import MainLayout from './layouts/MainLayout';
import HistoryPage from './pages/HistoryPage';
import Signin from './pages/SignInPage';
import Signup from './pages/SignUpPage';
import ResetPassword from './pages/ResetPasswordPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
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
