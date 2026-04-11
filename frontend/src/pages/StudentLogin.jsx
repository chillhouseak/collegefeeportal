import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const StudentLogin = () => {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/student/login', {
        enrollmentNumber,
        semester: Number(semester)
      });

      if (response.data.student) {
        localStorage.setItem('studentInfo', JSON.stringify(response.data.student));
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header Section */}
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Student Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your fees and exams
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700">
                Enrollment Number
              </label>
              <input
                id="enrollmentNumber"
                name="enrollmentNumber"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 mt-1 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="e.g. CS101"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <input
                id="semester"
                name="semester"
                type="number"
                required
                className="appearance-none relative block w-full px-3 py-3 mt-1 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="e.g. 3"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
               Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;