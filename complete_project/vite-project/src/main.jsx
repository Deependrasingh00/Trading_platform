import { StrictMode, lazy, Suspense } from "react";
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

import MaintenanceGuard from "./components/MaintenanceGuard.jsx";
import SecurityGuard from "./components/SecurityGuard.jsx";

// Lazy load pages to decrease initial bundle size and speed up startup loading
const Deposit = lazy(() => import("./pages/Deposit.jsx"));
const Developers = lazy(() => import("./pages/Developers.jsx"));
const Graph = lazy(() => import("./pages/Graph.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const Adminlogin = lazy(() => import("./pages/Adminlogin.jsx"));
const Businesses = lazy(() => import("./pages/Businesses.jsx"));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#020817] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
        <Suspense fallback={<LoadingSpinner />}>
          <RouterProvider router={Router} />
        </Suspense>
      </MaintenanceGuard>
    </SecurityGuard>
  </StrictMode>
);

