const express = require('express');
const router = express.Router();

const { generateFeeReceipt, generateAdmitCard, generateHistoricalReceipt } = require('../controllers/pdfController');

// GET routes to download the PDFs (we use GET because browsers can easily download from GET links)
router.get('/receipt/:enrollmentNumber', generateFeeReceipt);
router.get('/admit-card/:enrollmentNumber', generateAdmitCard);
router.get('/historical-receipt/:transactionId', generateHistoricalReceipt);
module.exports = router;