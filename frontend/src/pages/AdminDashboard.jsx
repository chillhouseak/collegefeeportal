import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [expandedCourse, setExpandedCourse] = useState(null);
  const navigate = useNavigate();

  // Define the structure of your courses
  const courseStructure = {
    BCA: [1, 2, 3, 4, 5, 6],
    MCA: [1, 2, 3, 4],
    MSc: [1, 2, 3, 4],
    MBA: [1, 2, 3, 4]
  };

  const toggleCourse = (course) => {
    setExpandedCourse(expandedCourse === course ? null : course);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-gray-500">Select a course and semester to manage student data and uploads.</p>
        </div>

        {/* Course Directory */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Directory</h2>
          <div className="space-y-3">
            {Object.keys(courseStructure).map((course) => (
              <div key={course} className="border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => toggleCourse(course)}
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-lg">{course}</span>
                  <span className="text-2xl text-slate-500">{expandedCourse === course ? '−' : '+'}</span>
                </button>
                
                {/* Dropdown Semesters */}
                {expandedCourse === course && (
                  <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gray-200">
                    {courseStructure[course].map((sem) => (
                      <button 
                        key={sem}
                        onClick={() => navigate(`/admin/students/${course}/${sem}`)}
                        className="p-3 border border-blue-100 rounded-lg text-blue-700 font-medium hover:bg-blue-50 hover:border-blue-300 transition-all flex justify-between items-center"
                      >
                        <span>Semester {sem}</span>
                        <span>→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;