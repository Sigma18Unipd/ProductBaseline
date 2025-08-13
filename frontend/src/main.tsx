import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import "./index.css"
import Login from "./features/auth/login";
import Register from './features/auth/register';
import Confirm from './features/auth/confirm';
import Edit from './features/edit/edit';
import Dashboard from './features/dashboard/dashboard';

function DefaultErrorPage() {
  return (
    <div>
      <h1>Oops! Something went wrong</h1>
      <p>The page you’re looking for might have been moved or doesn't exist.</p>
      <a href="/login">Click here to Login</a>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <DefaultErrorPage />, // Global error page
    children: [
      {
        index: true,
        loader: () => redirect("/login"), // Redirect root to login
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