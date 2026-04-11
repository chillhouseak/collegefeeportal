import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Navbar
import Navbar from './components/Nav'; 
// Note: If you eventually create separate navbars, import them here 
// e.g., import AdminNavbar from './components/AdminNavbar';

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

  // 1. Define exactly where Navbars should NEVER appear
  const isAuthPage = 
    path === '/student/login' || 
    path === '/admin/login' || 
    path === '/admin/register' || 
    path === '/';

  // (Optional) If your <Navbar /> component handles BOTH admin and student links internally, 
  // you just need this one check. If you end up making two totally separate components, 
  // you can use the strict URL rules like this:
  // const showAdminNavbar = path.startsWith('/admin') && !isAuthPage;
  // const showStudentNavbar = path.startsWith('/student') && !isAuthPage;

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 2. Only show the Navbar if the user is NOT on an auth page */}
      {!isAuthPage && <Navbar />}

      {/* If using separate components, you would do this instead: */}
      {/* {showAdminNavbar && <AdminNavbar />} */}
      {/* {showStudentNavbar && <StudentNavbar />} */}

      <Routes>
        <Route path="/" element={<Navigate to="/student/login" />} />
        
        {/* Public Login Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        
        {/* Protected Student Route */}
        <Route 
          path="/student/dashboard" 
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          } 
        />
        
        {/* Protected Admin Route */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* Protected Admin Student List Route */}
        <Route 
          path="/admin/students/:course/:semester" 
          element={
            <AdminRoute>
              <AdminStudentList />
            </AdminRoute>
          } 
        />
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