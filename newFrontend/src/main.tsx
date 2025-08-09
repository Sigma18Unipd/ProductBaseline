import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import "./index.css"
import Login from "./features/auth/login";
import Register from './features/auth/register';
import Confirm from './features/auth/confirm';
import Edit from './features/edit/edit';
import Dashboard from './features/dashboard/dashboard';

const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      return redirect("/login");
    },
  },
    {
    path: "/login",
    element:  <Login />
  },
  {
    path: "/register",
    element:  <Register />
  },
  {
    path: "/confirm",
    element:  <Confirm />
  },
  {
    path: "/edit/:id",
    element:  <Edit />
  },
  {
    path: "/dashboard",
    element:  <Dashboard />
  }
]);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)