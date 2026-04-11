const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const { 
    uploadStudentData, 
    getAllStudents, 
    adminRegister, 
    deleteStudent,
    adminLogin,
    getSettings,
    toggleExamFormStatus,
     deleteAllStudents, 
        downloadStudentExcel 
} = require('../controllers/adminControllers');

// --- MULTER CONFIG FOR PDF FEE STRUCTURE ---
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, 'Official_Fee_Structure.pdf');
    }
});
const uploadPdf = multer({ storage: pdfStorage });

// --- SIMPLE UNPROTECTED ROUTES ---
router.post('/register', adminRegister);
router.post('/login', adminLogin);

// REMOVED 'protectAdmin' from all of these! Everything is open and simple now.
router.post('/upload-students', upload.single('file'), uploadStudentData);
router.get('/students', getAllStudents);
router.delete('/students/:id', deleteStudent);

// Fee Structure Upload
router.post('/upload-fee-structure', uploadPdf.single('feeStructureFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please select a PDF to upload.' });
    }
    res.status(200).json({ message: 'Fee structure updated successfully!' });
});

router.get('/settings', getSettings);
router.put('/settings/toggle-exam-form', toggleExamFormStatus);
router.delete('/delete-all-students', deleteAllStudents);
router.get('/download-excel', downloadStudentExcel);
module.exports = router;