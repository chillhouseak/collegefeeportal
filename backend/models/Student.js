const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Basic Details
    enrollmentNumber: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    fatherName: { type: String, default: 'N/A' },
    motherName: { type: String, default: 'N/A' },
    gender: { type: String, default: 'N/A' },
    course: { type: String, required: true, uppercase: true },
    semester: { type: Number, required: true },
    
    // Fee Breakdown (Numbers from Excel Upload)
    feeAmount: { type: Number, required: true }, // The Grand Total
    academicFee: { type: Number, default: 0 },
    developmentFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    universityFee: { type: Number, default: 0 },
    cautionMoney: { type: Number, default: 0 },
    alumniFee: { type: Number, default: 0 },
    
    // Portal Status Locks
    hasPaidFee: { type: Boolean, default: false },
    examFormSubmitted: { type: Boolean, default: false },
    
    // NEW: Real Razorpay Transaction & Application Tracking
    feePaymentId: { type: String, default: 'N/A' },   // Stores the Razorpay ID for Semester Fee
    examPaymentId: { type: String, default: 'N/A' },  // Stores the Razorpay ID for Exam Fee
    applicationId: { 
        type: String, 
        // Automatically generates a unique 7-digit Application ID (e.g., APP8349210) for every student!
        default: () => 'APP' + Math.floor(1000000 + Math.random() * 9000000) 
    }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt dates to every record
});

module.exports = mongoose.model('Student', studentSchema);