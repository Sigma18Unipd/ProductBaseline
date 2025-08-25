import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import "./index.css"
import Login from "./features/auth/login";
import Register from './features/auth/register';
import Confirm from './features/auth/confirm';
import Edit from './features/edit/edit';
import Dashboard from './features/dashboard/dashboard';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
function DefaultErrorPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/login");
  }, [navigate]);
  return <div>404, Redirecting...</div>;
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <DefaultErrorPage />,
    children: [
      {
        index: true,
        loader: () => redirect("/login"),
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "confirm",
        element: <Confirm />,
      },
      {
        path: "edit/:id",
        element: <Edit />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "*",
        element: <DefaultErrorPage />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)