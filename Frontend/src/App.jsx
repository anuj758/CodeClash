import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Problemset from "./pages/Problem";
import Contest from "./pages/Contest";
import Battle from "./pages/Battle";
import VerifyEmail from "./pages/EmailVerify";
import Navigation from "./component/Navigation";
import PendingVerification from "./pages/Verification";
import ProtectedRoute from "./component/ProtectedRoute";
import Profile from "./pages/Profile";
import ProblemDetail from './pages/ProblemDetail';
import AdminDashboard from './pages/AdminDashBoard';

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/problemset" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/problemset" replace />;
  }

  return <Outlet />;
};

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      setIsInitialized(true);
    });
  }, [dispatch]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Check if current route is the problem workspace page
  const isProblemDetailPage = location.pathname.startsWith('/problem/');

  return (
    <>
      {!isProblemDetailPage && <Navigation />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<PendingVerification />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/problemset" element={<Problemset />} />
          <Route path="/contest" element={<Contest />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/problem/:problemNumber" element={<ProblemDetail />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>      
    </>
  );
}

export default App;