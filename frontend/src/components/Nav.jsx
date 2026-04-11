import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/unnamed.png'; // Import the logo from your assets folder

const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // STRICT RULE: We use the URL, not localStorage, to decide what the Navbar looks like.
  // This prevents the "dashboard logout admindashboard logout admin" overlap bug!
  const isAdminPortal = location.pathname.startsWith('/admin');

  // Specific logout for Students
  const handleStudentLogout = () => {
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  // Specific logout for Admins
  const handleAdminLogout = () => {
    localStorage.removeItem('adminInfo'); // Clear admin data
    localStorage.removeItem('adminToken'); // Clear token (if you use one)
    navigate('/admin/login');
  };

  return (
    <nav className={isAdminPortal ? "bg-slate-800 shadow-md" : "bg-blue-600 shadow-md"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo and SCSIT Branding Section */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <img 
              src={logo} 
              alt="DAVV Logo" 
              className="h-10 w-10 object-contain bg-white rounded-full p-0.5 shadow-sm" 
            />
            <span className="text-white font-bold text-xl tracking-wider">
              SCSIT {isAdminPortal && <span className="text-sm text-slate-300 ml-2 font-normal">(Admin Mode)</span>}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            
            {isAdminPortal ? (
              // --- ONLY SHOW THESE IF IN ADMIN PORTAL ---
              <>
                <Link to="/admin/dashboard" className="text-white hover:text-slate-300 px-3 py-2 text-sm font-medium transition-colors">
                  Admin Dashboard
                </Link>
                <button 
                  onClick={handleAdminLogout} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 ml-2 rounded-lg text-sm font-bold transition-all shadow-sm border border-red-700"
                >
                  Logout Admin
                </button>
              </>
            ) : (
              // --- ONLY SHOW THESE IF IN STUDENT PORTAL ---
              <>
                <Link to="/student/dashboard" className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={handleStudentLogout} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 ml-2 rounded-lg text-sm font-bold transition-all shadow-sm border border-red-700"
                >
                  Logout
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;