import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Navbar
import Navbar from './components/Nav'; 

// Protected Routes
import { StudentRoute, AdminRoute } from './components/ProtectedRoutes'; 

// Pages
import AdminRegister from './pages/AdminRegister';
import StudentLogin from './pages/StudentLogin'; 
import StudentDashboard from './pages/StudentDashboard';
import AdminLogin from './pages/AdminLogin'; 
import AdminDashboard from './pages/AdminDashboard';
import AdminStudentList from './pages/AdminStudentList';

// --- WRAPPER COMPONENT FOR CONDITIONAL NAVBAR ---
const AppContent = () => {
  const location = useLocation();
  const path = location.pathname;

  // Look for the Vercel variable. If it doesn't exist (like on your local PC), default to 'BOTH'.
  const PORTAL_TYPE = import.meta.env.VITE_PORTAL_TYPE || 'BOTH';

  // 1. Define exactly where Navbars should NEVER appear
  const isAuthPage = 
    path === '/student/login' || 
    path === '/admin/login' || 
    path === '/admin/register' || 
    path === '/';

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 2. Only show the Navbar if the user is NOT on an auth page */}
      {!isAuthPage && <Navbar />}

      <Routes>
        {/* Default redirect based on portal type */}
        <Route path="/" element={<Navigate to={PORTAL_TYPE === 'ADMIN' ? "/admin/login" : "/student/login"} />} />
        
        {/* --- STUDENT ROUTES --- */}
        {/* Only show if type is STUDENT or BOTH */}
        {(PORTAL_TYPE === 'STUDENT' || PORTAL_TYPE === 'BOTH') && (
          <>
            <Route path="/student/login" element={<StudentLogin />} />
            <Route 
              path="/student/dashboard" 
              element={
                <StudentRoute>
                  <StudentDashboard />
                </StudentRoute>
              } 
            />
          </>
        )}

        {/* --- ADMIN ROUTES --- */}
        {/* Only show if type is ADMIN or BOTH */}
        {(PORTAL_TYPE === 'ADMIN' || PORTAL_TYPE === 'BOTH') && (
          <>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/students/:course/:semester" 
              element={
                <AdminRoute>
                  <AdminStudentList />
                </AdminRoute>
              } 
            />
          </>
        )}
        
        {/* --- 404 FALLBACK --- */}
        {/* If a student tries to guess the /admin URL, they hit this instead of the login page */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <p className="text-xl text-gray-600 font-medium">Page not found on this portal.</p>
          </div>
        } />
      </Routes>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;