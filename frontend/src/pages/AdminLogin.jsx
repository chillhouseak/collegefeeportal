import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/admin/login', { email, password });
      
      if (response.data.admin) {
        localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      {/* THIS is the white box container */}
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-2xl border border-gray-100">
        
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Admin Portal</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Secure staff login</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 mt-1 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-slate-800 focus:border-slate-800 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 mt-1 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-slate-800 focus:border-slate-800 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 transition-colors"
          >
            Admin Login
          </button>
        </form>

        {/* The link is now safely INSIDE the white box container */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Need an account?{' '}
            <Link to="/admin/register" className="font-medium text-slate-800 hover:underline">
              Register here
            </Link>
          </p>
        </div>
        
      </div> {/* <-- End of the white box container */}
    </div>
  );
};

export default AdminLogin;