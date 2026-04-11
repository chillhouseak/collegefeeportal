import React from 'react';
import { Navigate } from 'react-router-dom';

// Wrapper for Student Pages
export const StudentRoute = ({ children }) => {
  const isStudent = localStorage.getItem('studentInfo');
  
  if (!isStudent) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
};

// Wrapper for Admin Pages
export const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('adminInfo');
  
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};