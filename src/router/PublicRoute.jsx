/**
 * PublicRoute.jsx
 * Path: src/router/PublicRoute.jsx
 * Description: Public route guard - redirects to dashboard if already authenticated
 * Changes:
 * - ✅ FIXED: Redirect to dashboard if authenticated
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const PublicRoute = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (user && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the children
  return children;
};

export default PublicRoute;
