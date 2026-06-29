import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import Deposit from "./pages/Deposit.jsx";
import Developers from "./pages/Developers.jsx";
import Graph from "./pages/Graph.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Adminlogin from "./pages/Adminlogin.jsx";
import Businesses from "./pages/Businesses.jsx";
import MaintenanceGuard from "./components/MaintenanceGuard.jsx";
import SecurityGuard from "./components/SecurityGuard.jsx";

// User protected route - token check on every render
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// Admin protected route
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin-login" replace />;
};

const Router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/graph" element={<Graph />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<Adminlogin />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Admin />
          </AdminProtectedRoute>
        }
      />
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SecurityGuard>
      <MaintenanceGuard>
        <RouterProvider router={Router} />
      </MaintenanceGuard>
    </SecurityGuard>
  </StrictMode>
);

