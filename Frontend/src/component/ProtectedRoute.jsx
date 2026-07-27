// src/component/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useSelector((state) => state.auth);

    
    if (loading) {
        return (
            <div className="min-h-screen bg-base-300 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}