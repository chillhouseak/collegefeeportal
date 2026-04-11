const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    enrollmentNumber: { type: String, required: true, uppercase: true },
    studentName: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    
    // The exact unique IDs
    feePaymentId: { type: String, required: true }, // Razorpay ID
    applicationId: { type: String, required: true }, // APP1234567
    
    // The exact financial snapshot at the time of payment
    feeAmount: { type: Number, required: true },
    academicFee: { type: Number, default: 0 },
    developmentFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    universityFee: { type: Number, default: 0 },
    
    datePaid: { type: Date, default: Date.now },
    fatherName: { type: String, default: 'N/A' },
    motherName: { type: String, default: 'N/A' },
    cautionMoney: { type: Number, default: 0 },
    alumniFee: { type: Number, default: 0 }
});

module.exports = mongoose.model('Transaction', transactionSchema);