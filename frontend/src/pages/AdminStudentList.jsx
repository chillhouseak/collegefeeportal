import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminStudentList = () => {
  const { course, semester } = useParams();
  const navigate = useNavigate();
  
  // Table States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Excel Upload States
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // PDF Fee Structure Upload States
  const [feeFile, setFeeFile] = useState(null);
  const [feeUploadStatus, setFeeUploadStatus] = useState('');

  // Global Exam Form Toggle State
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Fetch functions
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students?course=${course}&semester=${semester}`);
      setStudents(response.data.students);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setExamFormOpen(response.data.isExamFormOpen);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSettings(); 
  }, [course, semester]);

  // Handle Global Exam Form Toggle
  const handleToggleExamForm = async () => {
    setToggling(true);
    try {
      const response = await api.put('/admin/settings/toggle-exam-form');
      setExamFormOpen(response.data.isExamFormOpen);
      alert(response.data.message); 
    } catch (error) {
      alert('Failed to toggle settings. Please check your backend connection.');
    } finally {
      setToggling(false);
    }
  };

  // --- NEW: Handle Delete All Students ---
  const handleDeleteAll = async () => {
    if (students.length === 0) return alert('No records to delete.');
    
    // Double confirmation to prevent catastrophic accidents
    const confirm1 = window.confirm(`WARNING: Are you sure you want to delete ALL ${students.length} students for ${course} Semester ${semester}?`);
    if (!confirm1) return;
    
    const confirm2 = window.confirm("This action CANNOT BE UNDONE. Click OK to permanently wipe these records.");
    if (!confirm2) return;

    try {
      await api.delete(`/admin/delete-all-students?course=${course}&semester=${semester}`);
      setStudents([]); // Instantly clear the table on the UI
      alert('All records have been successfully deleted.');
    } catch (error) {
      console.error(error);
      alert('Failed to delete records.');
    }
  };

  // --- NEW: Handle Download Excel ---
  const handleDownloadExcel = async () => {
    if (students.length === 0) return alert('No records to download.');
    
    try {
      // Must set responseType to 'blob' to handle binary file downloads
      const response = await api.get(`/admin/download-excel?course=${course}&semester=${semester}`, {
        responseType: 'blob', 
      });
      
      // Create a temporary link and trigger browser download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${String(course).toUpperCase()}_Sem${semester}_Records.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert('Failed to download Excel file.');
    }
  };

  // Excel Upload Handlers
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage({ type: 'error', text: 'Please select an Excel file.' });

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/admin/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: response.data.message });
      setFile(null);
      document.getElementById('file-upload').value = ''; 
      fetchStudents();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  // PDF Fee Structure Upload Handler
  const handleFeeStructureUpload = async (e) => {
    e.preventDefault();
    if (!feeFile) return;

    const formData = new FormData();
    formData.append('feeStructureFile', feeFile);

    try {
      setFeeUploadStatus('Uploading...');
      await api.post('/admin/upload-fee-structure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeeUploadStatus('Success! New Fee Structure is live.');
      setFeeFile(null);
      document.getElementById('fee-pdf-upload').value = ''; 
      setTimeout(() => setFeeUploadStatus(''), 4000);
    } catch (error) {
      setFeeUploadStatus('Upload failed. Please try again.');
    }
  };

  // Delete Individual Handler
  const handleDelete = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}'s record?`)) {
      try {
        await api.delete(`/admin/students/${studentId}`);
        setStudents(students.filter(student => student._id !== studentId));
      } catch (error) {
        console.error('Failed to delete student', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 bg-white text-slate-600 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            ← Back to Directory
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{String(course).toUpperCase()} - Semester {semester}</h1>
        </div>

        {/* GLOBAL MASTER SETTINGS CARD */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-md border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-xl">⚙️</span> Examination Form Portal Access
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Currently, students are <strong className={examFormOpen ? 'text-green-400' : 'text-red-400'}>{examFormOpen ? 'ALLOWED' : 'BLOCKED'}</strong> from submitting exam forms.
            </p>
          </div>
          <button 
            onClick={handleToggleExamForm}
            disabled={toggling}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${examFormOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}
          >
            {toggling ? 'Updating...' : (examFormOpen ? 'CLOSE PORTAL' : 'OPEN PORTAL')}
          </button>
        </div>

        {/* 1. EXCEL Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload Semester Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload the 14-column Excel sheet. Existing students will be updated and fee statuses will reset.
          </p>
          <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-4">
            <input 
              id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
            <button type="submit" disabled={uploading || !file} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium rounded-md transition-colors whitespace-nowrap">
              {uploading ? 'Processing...' : 'Upload & Update'}
            </button>
          </form>
          {message.text && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* 2. PDF Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Update Master Fee Structure (PDF)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload the official PDF document. This will overwrite the old file and be immediately visible to all students.
          </p>
          <form onSubmit={handleFeeStructureUpload} className="flex flex-col sm:flex-row gap-4">
            <input 
              id="fee-pdf-upload" type="file" accept="application/pdf" 
              onChange={(e) => setFeeFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors"
            />
            <button type="submit" disabled={!feeFile} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-md transition-colors whitespace-nowrap">
              Publish PDF
            </button>
          </form>
          {feeUploadStatus && (
            <div className="mt-4 p-3 rounded-md text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {feeUploadStatus}
            </div>
          )}
        </div>

        {/* 3. Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* --- UPGRADED TABLE HEADER WITH EXPORT/DELETE BUTTONS --- */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 text-lg">Student Records</h3>
              <span className="text-sm text-gray-500">Total Found: {students.length}</span>
            </div>
            
            {/* The New Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadExcel}
                disabled={students.length === 0}
                className="px-4 py-2 text-sm font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                ⬇️ Export Data
              </button>
              
              <button 
                onClick={handleDeleteAll}
                disabled={students.length === 0}
                className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-800 hover:bg-red-200 border border-red-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                🗑️ Delete All
              </button>
            </div>
          </div>
          
          {loading ? (
            <p className="p-6 text-center text-gray-500">Loading records...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Parents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statuses</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      {/* 1. Enrollment */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.enrollmentNumber}
                      </td>
                      
                      {/* 2. Name & Parents */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">F: {student.fatherName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">M: {student.motherName || 'N/A'}</div>
                      </td>

                      {/* 3. Gender */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.gender?.toLowerCase() === 'girl' || student.gender?.toLowerCase() === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                          {student.gender || 'N/A'}
                        </span>
                      </td>

                      {/* 4. Course */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {student.course}
                      </td>

                      {/* 5. Fees (Total + Tooltip for breakdown) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-700">₹{student.feeAmount}</div>
                        <div 
                          className="text-xs text-blue-500 cursor-help underline mt-0.5"
                          title={`Academic: ₹${student.academicFee} | Dev: ₹${student.developmentFee} | Exam: ₹${student.examFee} | Uni: ₹${student.universityFee} | Caution: ₹${student.cautionMoney} | Alumni: ₹${student.alumniFee}`}
                        >
                          View Breakdown
                        </div>
                      </td>

                      {/* 6. Statuses (Fee & Exam stacked) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="mb-1">
                          <span className={`px-2 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-sm ${student.hasPaidFee ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            FEE: {student.hasPaidFee ? 'PAID' : 'PENDING'}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-sm ${student.examFormSubmitted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            EXAM: {student.examFormSubmitted ? 'SUBMITTED' : 'LOCKED'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(student._id, student.name)}
                          className="text-red-500 hover:text-red-700 font-semibold px-3 py-1 border border-red-200 hover:border-red-300 rounded-md transition-all bg-red-50 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-4xl mb-3">📁</span>
                          <p className="text-lg font-medium text-gray-900">No records found</p>
                          <p className="text-sm mt-1">Make sure you uploaded the 14-column Excel file.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminStudentList;