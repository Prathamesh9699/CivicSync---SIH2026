import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = role === 'admin' || role === 'administrator';

  if (allowedRoles.length > 0 && !allowedRoles.includes(role) && !isAdmin) {
    return <Navigate to="/access-restricted" replace />;
  }

  return <Outlet />;
};
