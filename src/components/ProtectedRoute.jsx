import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('accessToken');

    // Basic check: If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, render children (Dashboard)
    return <Outlet />;
};

export default ProtectedRoute;
