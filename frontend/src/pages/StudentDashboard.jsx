import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// --- RAZORPAY HELPER (Place this outside the main component) ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  // Load student data when the component mounts
  useEffect(() => {
    const savedStudent = localStorage.getItem('studentInfo');
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
    } else {
      // If no data is found, kick them back to login
      navigate('/student/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  // Fetch History once the student is loaded
  useEffect(() => {
    if (student?.enrollmentNumber) {
      const fetchHistory = async () => {
        try {
          const response = await api.get(`/student/history/${student.enrollmentNumber}`);
          setHistory(response.data);
        } catch (error) {
          console.error("Failed to fetch history:", error);
        }
      };
      fetchHistory();
    }
  }, [student?.enrollmentNumber]);

  // --- NEW RAZORPAY PAYMENT FUNCTION ---
  const handlePayment = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Load the Razorpay SDK
      const res = await loadRazorpayScript();
      if (!res) {
        setMessage({ type: 'error', text: 'Razorpay SDK failed to load. Check your internet connection.' });
        setLoading(false);
        return;
      }

      // 2. Ask backend to create a secure Order
      const orderResponse = await api.post('/student/create-order', {
        enrollmentNumber: student.enrollmentNumber
      });
      const { order, key_id } = orderResponse.data;

      // 3. Configure the Razorpay Popup
      const options = {
        key: key_id, 
        amount: order.amount, 
        currency: order.currency,
        name: "SCSIT College",
        description: `Semester Fee Payment - Sem ${student.semester}`,
        order_id: order.id,
        
        // This handler runs AUTOMATICALLY if the payment succeeds in the popup
        handler: async function (response) {
          try {
            setMessage({ type: 'success', text: 'Processing verification...' });
            
            // 4. Send the successful payment data back to our server to verify
            const verifyRes = await api.post('/student/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              enrollmentNumber: student.enrollmentNumber
            });

            // 5. Instantly update the UI!
            const updatedStudent = verifyRes.data.student;
            // Preserve the isExamFormOpen flag from the current state
            updatedStudent.isExamFormOpen = student.isExamFormOpen; 
            
            setStudent(updatedStudent);
            localStorage.setItem('studentInfo', JSON.stringify(updatedStudent));
            setMessage({ type: 'success', text: 'Fee payment verified successfully!' });
            
            // OPTIONAL: Refresh the history table immediately after payment!
            const historyRes = await api.get(`/student/history/${student.enrollmentNumber}`);
            setHistory(historyRes.data);

          } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Payment verification failed.' });
          }
        },
        prefill: {
          name: student.name,
          email: "student@example.com", 
          contact: "9999999999" 
        },
        theme: {
          color: "#2563EB" // Blue theme matching your UI
        }
      };

      // 4. Open the Razorpay Modal
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not initiate payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExamForm = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Load Razorpay
      const res = await loadRazorpayScript();
      if (!res) {
        setMessage({ type: 'error', text: 'Razorpay SDK failed to load.' });
        setLoading(false);
        return;
      }

      // 2. Ask backend for the Exam Order
      const orderResponse = await api.post('/student/create-exam-order', {
        enrollmentNumber: student.enrollmentNumber
      });
      const { order, key_id } = orderResponse.data;

      // 3. Configure the Exam Form Popup
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "SCSIT College",
        description: `Examination Form Fee - Sem ${student.semester}`,
        order_id: order.id,
        
        handler: async function (response) {
          try {
            setMessage({ type: 'success', text: 'Verifying exam payment...' });
            
            // 4. Send to backend for verification
            const verifyRes = await api.post('/student/verify-exam-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              enrollmentNumber: student.enrollmentNumber
            });

            // 5. Update UI instantly
            const updatedStudent = verifyRes.data.student;
            updatedStudent.isExamFormOpen = student.isExamFormOpen; // Preserve the admin toggle state
            
            setStudent(updatedStudent);
            localStorage.setItem('studentInfo', JSON.stringify(updatedStudent));
            setMessage({ type: 'success', text: 'Exam form submitted and paid successfully!' });
            
          } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Exam payment failed.' });
          }
        },
        prefill: {
          name: student.name,
          email: "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#1E293B" // A sleek dark slate color for exams
        }
      };

      // 4. Open the Razorpay Modal
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not initiate exam payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type) => {
    // Open the PDF download link in a new tab (Current Semester)
    const url = `http://localhost:5000/api/pdf/${type}/${student.enrollmentNumber}`;
    window.open(url, '_blank');
  };

  // --- NEW: Download Historical Receipt ---
  const handleDownloadHistorical = (transactionId) => {
    const url = `http://localhost:5000/api/pdf/historical-receipt/${transactionId}`;
    window.open(url, '_blank');
  };

  if (!student) return null; // Prevent rendering before redirect

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {student.name}</h1>
            <p className="text-gray-500 mt-1 font-medium">
              {student.enrollmentNumber} | {student.course} - Sem {student.semester} 
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                {student.gender || 'N/A'}
              </span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Notifications */}
        {message.text && (
          <div className={`p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* --- FEE SECTION --- */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            {/* Decorative background shape */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>

            <div className="relative">
              {/* Header & Status */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Semester Fee Breakdown</h2>
                  <a 
                    href="http://localhost:5000/uploads/Official_Fee_Structure.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1 font-medium"
                  >
                    📄 View Official Fee Structure Document
                  </a>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm ${student.hasPaidFee ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  {student.hasPaidFee ? '✓ PAID' : '⏳ PENDING'}
                </span>
              </div>

              {/* The Dynamic Fee Breakdown Box */}
              <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex justify-between">
                    <span>Academic Fee</span> 
                    <span className="font-medium text-slate-900">₹{student.academicFee || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Development & Maintenance</span> 
                    <span className="font-medium text-slate-900">₹{student.developmentFee || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Examination Fee</span> 
                    <span className="font-medium text-slate-900">₹{student.examFee || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>University Fee</span> 
                    <span className="font-medium text-slate-900">₹{student.universityFee || 0}</span>
                  </li>
                  
                  {/* Conditionally render if they exist in the uploaded record */}
                  {(student.cautionMoney > 0) && (
                    <li className="flex justify-between">
                      <span>Caution Money (Refundable)</span> 
                      <span className="font-medium text-slate-900">₹{student.cautionMoney}</span>
                    </li>
                  )}
                  {(student.alumniFee > 0) && (
                    <li className="flex justify-between">
                      <span>Alumni Fee</span> 
                      <span className="font-medium text-slate-900">₹{student.alumniFee}</span>
                    </li>
                  )}
                </ul>
                
                {/* Total Amount Divider */}
                <div className="mt-4 pt-4 border-t border-slate-300 flex justify-between items-end">
                  <span className="text-slate-800 font-semibold">Total Amount Due</span>
                  <span className="text-3xl font-extrabold text-blue-700">₹{student.feeAmount || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end">
                {!student.hasPaidFee ? (
                  <button 
                    onClick={handlePayment}
                    disabled={loading || !student.feeAmount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:bg-blue-300 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Processing...' : 'Pay Fee Securely'} 💳
                  </button>
                ) : (
                  <button 
                    onClick={() => handleDownload('receipt')}
                    className="w-full bg-white border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 px-8 py-3 rounded-xl font-semibold transition-all flex justify-center items-center gap-2"
                  >
                    Download Official Receipt ⬇️
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* --- END FEE SECTION --- */}

          {/* Exam Form Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Examination Form</h2>
            
            <div className="flex-grow space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Current Status:</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${student.examFormSubmitted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {student.examFormSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}
                </span>
              </div>

              {/* Strict Exam Rules Logic */}
              {!student.isExamFormOpen ? (
                <div className="p-5 bg-gray-100 border border-gray-200 rounded-xl text-center text-sm font-medium text-gray-600 flex flex-col items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  The Examination Portal is currently closed by the Administration.
                </div>
              ) : !student.hasPaidFee ? (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center text-sm font-medium text-amber-800 flex flex-col items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  You must clear your pending semester fee before the examination form unlocks.
                </div>
              ) : !student.examFormSubmitted ? (
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl text-center text-sm font-medium text-blue-800">
                  Your fee is cleared and the portal is OPEN. You may submit your form.
                </div>
              ) : (
                <div className="p-5 bg-green-50 border border-green-100 rounded-xl text-center text-sm font-medium text-green-800">
                  Your examination form has been successfully processed and verified.
                </div>
              )}
            </div>

            {/* Exam Actions */}
            <div className="mt-6">
              {/* Only show submit button if Portal is OPEN, Fee is PAID, and NOT already submitted */}
              {student.isExamFormOpen && student.hasPaidFee && !student.examFormSubmitted && (
                <button 
                  onClick={handleSubmitExamForm}
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Submit Exam Form'}
                </button>
              )}
              
              {student.examFormSubmitted && (
                <button 
                  onClick={() => handleDownload('admit-card')}
                  className="w-full py-3.5 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all"
                >
                  Download Admit Card
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- NEW: PAST TRANSACTIONS (THE VAULT) --- */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏦</span>
            <h2 className="text-xl font-bold text-gray-800">Permanent Payment History</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-xl border border-dashed border-gray-300">
              No past transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-slate-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Date</th>
                    <th className="px-4 py-3">Course/Sem</th>
                    <th className="px-4 py-3">App ID</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((txn) => (
                    <tr key={txn._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {new Date(txn.datePaid).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">{txn.course} - Sem {txn.semester}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{txn.applicationId}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">₹{txn.feeAmount}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleDownloadHistorical(txn._id)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                          Download Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;