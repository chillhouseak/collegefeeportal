const express = require('express');
const router = express.Router();
const { studentLogin, payFee, submitExamForm ,createPaymentOrder, verifyPayment,createExamOrder, verifyExamPayment, getPaymentHistory} = require('../controllers/studentController');
const { protectStudent } = require('../middleware/authMiddleware');
router.post('/login', studentLogin);
router.put('/pay-fee', payFee);
router.put('/submit-exam-form', submitExamForm);
router.put('/pay-fee', protectStudent, payFee);
router.put('/submit-exam-form', protectStudent, submitExamForm);
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/create-exam-order', createExamOrder);
router.post('/verify-exam-payment', verifyExamPayment);
router.get('/history/:enrollmentNumber', getPaymentHistory);
module.exports = router