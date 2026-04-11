const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');
const Razorpay = require('razorpay');
const crypto = require('crypto'); 
const Transaction = require('../models/Transaction');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const studentLogin = async (req, res) => {
    try {
        // Grab the enrollment number and semester from the login form
        const { enrollmentNumber, semester } = req.body;

        if (!enrollmentNumber || !semester) {
            return res.status(400).json({ message: 'Please provide both Enrollment Number and Semester' });
        }

        // 1. Force enrollment number to UPPERCASE to prevent case-sensitive errors
        const cleanEnrollment = String(enrollmentNumber).trim().toUpperCase();
        const inputSemester = parseInt(semester, 10);

        // 2. Find the student in the database
        const student = await Student.findOne({ enrollmentNumber: cleanEnrollment });

        if (!student) {
            return res.status(404).json({ message: 'Student not found. Please check your Enrollment Number.' });
        }

        // 3. THE PROMOTION CHECK: Does the semester they typed match their CURRENT database semester?
        if (student.semester !== inputSemester) {
            return res.status(401).json({ 
                message: `Access Denied. You are currently registered in Semester ${student.semester}, not Semester ${inputSemester}.` 
            });
        }

        // 4. If they match, generate a login token!
        const token = jwt.sign(
            { id: student._id, role: 'student', enrollmentNumber: student.enrollmentNumber },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        const globalSettings = await Settings.findOne({ key: 'global_settings' });
        const isExamFormOpen = globalSettings ? globalSettings.isExamFormOpen : false;

        res.status(200).json({
            message: 'Login successful!',
            student: {
                id: student._id,
                name: student.name,
                enrollmentNumber: student.enrollmentNumber,
                course: student.course,
                semester: student.semester,
                gender: student.gender,
                hasPaidFee: student.hasPaidFee,
                examFormSubmitted: student.examFormSubmitted,
                isExamFormOpen: isExamFormOpen,
                token: token,
                feeAmount: student.feeAmount,
                academicFee: student.academicFee,
                developmentFee: student.developmentFee,
                examFee: student.examFee,
                universityFee: student.universityFee,
                cautionMoney: student.cautionMoney,
                alumniFee: student.alumniFee
            }
        });

    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};



const payFee = async (req, res) => {
    const { enrollmentNumber } = req.body;

    try {
        const student = await Student.findOne({ enrollmentNumber });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.hasPaidFee) {
            return res.status(400).json({ message: 'Fee has already been paid' });
        }

        student.hasPaidFee = true;
        await student.save();

        res.status(200).json({ 
            message: 'Fee payment successful', 
            student 
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ message: 'Server error during payment processing' });
    }
};

const submitExamForm = async (req, res) => {
    try {
        const { enrollmentNumber } = req.body;
        
        // RULE 1: Is the global switch turned ON by the admin?
        const globalSettings = await Settings.findOne({ key: 'global_settings' });
        if (!globalSettings || !globalSettings.isExamFormOpen) {
            return res.status(403).json({ message: 'The Admin has currently closed the examination forms.' });
        }

        const student = await Student.findOne({ enrollmentNumber: String(enrollmentNumber).toUpperCase() });
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // RULE 2: Did the student pay their fees?
        if (!student.hasPaidFee) {
            return res.status(403).json({ message: 'ACCESS DENIED: You must clear your semester fee before submitting the exam form.' });
        }

        // If they pass both rules, save the form!
        student.examFormSubmitted = true;
        await student.save();

        res.status(200).json({ message: 'Exam form submitted successfully!', student });
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting exam form.' });
    }
};
// 1. Create Order
const createPaymentOrder = async (req, res) => {
    try {
        const { enrollmentNumber } = req.body;
        const student = await Student.findOne({ enrollmentNumber });

        if (!student) return res.status(404).json({ message: 'Student not found.' });
        if (student.hasPaidFee) return res.status(400).json({ message: 'Fee already paid.' });

        // Razorpay accepts amounts in PAISE (multiply INR by 100)
        const options = {
            amount: student.feeAmount * 100, 
            currency: "INR",
            receipt: `receipt_${student.enrollmentNumber}_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        
        // We must send the Razorpay Key ID to the frontend to launch the popup
        res.status(200).json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Order Creation Error:', error);
        res.status(500).json({ message: 'Server error creating order.' });
    }
};

// 2. Verify Payment
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, enrollmentNumber } = req.body;

        // Create the expected signature using our secret
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Compare signatures to ensure a hacker didn't fake the payment success
        if (expectedSignature === razorpay_signature) {
            
            // Payment is verified! Update the student database
            const student = await Student.findOne({ enrollmentNumber });
            student.hasPaidFee = true;
            student.feePaymentId = razorpay_payment_id;
            await student.save();
            await Transaction.create({
                enrollmentNumber: student.enrollmentNumber,
                studentName: student.name,
                course: student.course,
                semester: student.semester,
                feePaymentId: razorpay_payment_id,
                applicationId: student.applicationId,
                feeAmount: student.feeAmount,
                academicFee: student.academicFee,
                developmentFee: student.developmentFee,
                examFee: student.examFee,
                universityFee: student.universityFee
            });

            res.status(200).json({ message: 'Payment verified successfully!', student });
        } else {
            res.status(400).json({ message: 'Invalid payment signature.' });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Server error verifying payment.' });
    }
};
// --- NEW: 1. Create Exam Form Order ---
const createExamOrder = async (req, res) => {
    try {
        const { enrollmentNumber } = req.body;
        const student = await Student.findOne({ enrollmentNumber });

        if (!student) return res.status(404).json({ message: 'Student not found.' });
        if (student.examFormSubmitted) return res.status(400).json({ message: 'Exam form already submitted.' });

        // Use the examFee from the database. If it's 0 or missing, default to 500 rupees
        const examAmount = student.examFee > 0 ? student.examFee : 500;

        const options = {
            amount: examAmount * 100, // Convert to paise
            currency: "INR",
            receipt: `exam_${student.enrollmentNumber}_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Exam Order Error:', error);
        res.status(500).json({ message: 'Server error creating exam order.' });
    }
};

// --- NEW: 2. Verify Exam Payment ---
const verifyExamPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, enrollmentNumber } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const student = await Student.findOne({ enrollmentNumber });
            
            // Mark the exam form as submitted!
            student.examFormSubmitted = true;
            student.examPaymentId = razorpay_payment_id;
            await student.save();

            res.status(200).json({ message: 'Exam form submitted successfully!', student });
        } else {
            res.status(400).json({ message: 'Invalid payment signature.' });
        }
    } catch (error) {
        console.error('Exam Verification Error:', error);
        res.status(500).json({ message: 'Server error verifying exam payment.' });
    }
};
const getPaymentHistory = async (req, res) => {
    try {
        const { enrollmentNumber } = req.params;
        // Find all past transactions for this enrollment number, sorted by newest first
        const history = await Transaction.find({ enrollmentNumber: String(enrollmentNumber).toUpperCase() }).sort({ datePaid: -1 });
        
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
};

// Export it: module.exports = { ..., getPaymentHistory };



module.exports = { studentLogin, payFee, submitExamForm,createPaymentOrder, verifyPayment , createExamOrder, 
    verifyExamPayment,getPaymentHistory  };