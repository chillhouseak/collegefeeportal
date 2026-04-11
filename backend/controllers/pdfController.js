const PDFDocument = require('pdfkit-table');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const { getSubjectsForStudent } = require('../utils/subjectMaster');

// ==========================================
// 1. GENERATE CURRENT SEMESTER FEE RECEIPT
// ==========================================
const generateFeeReceipt = async (req, res) => {
    try {
        const { enrollmentNumber } = req.params;
        const student = await Student.findOne({ enrollmentNumber: String(enrollmentNumber).toUpperCase() });

        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (!student.hasPaidFee) return res.status(400).json({ message: 'Cannot generate receipt. Fee has not been paid.' });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Fee_Receipt_${student.enrollmentNumber}.pdf`);

        doc.pipe(res);

        // --- HEADER ---
        doc.fontSize(16).font('Helvetica-Bold').text('SCHOOL OF COMPUTER SCIENCE & INFORMATION TECHNOLOGY', { align: 'center' });
        doc.fontSize(12).text('OFFICIAL FEE RECEIPT', { align: 'center' });
        doc.moveDown(2);

        // --- SECTION 1: TRANSACTION DETAILS ---
        const transactionTable = {
            title: "TRANSACTION DETAILS",
            headers: [
                { label: "Detail", property: "col1", width: 140 },
                { label: "Value", property: "col2", width: 140 },
                { label: "Detail", property: "col3", width: 140 },
                { label: "Value", property: "col4", width: 110 }
            ],
            datas: [
                { col1: "Application ID:", col2: student.applicationId || "N/A", col3: "Date:", col4: new Date().toLocaleDateString() },
                { col1: "Razorpay Transaction ID:", col2: student.feePaymentId || "N/A", col3: "Payment Status:", col4: "SUCCESSFUL" }
            ],
        };

        // --- SECTION 2: STUDENT INFORMATION ---
        const studentTable = {
            title: "STUDENT INFORMATION",
            headers: [
                { label: "Detail", property: "col1", width: 140 },
                { label: "Value", property: "col2", width: 140 },
                { label: "Detail", property: "col3", width: 140 },
                { label: "Value", property: "col4", width: 110 }
            ],
            datas: [
                { col1: "Enrollment No:", col2: student.enrollmentNumber, col3: "Course:", col4: student.course },
                { col1: "Student Name:", col2: student.name, col3: "Semester:", col4: `${student.semester}` },
                { col1: "Father's Name:", col2: student.fatherName || "N/A", col3: "Mother's Name:", col4: student.motherName || "N/A" }
            ],
        };

        // --- SECTION 3: FEE BREAKDOWN ---
        const feeBreakdownTable = {
            title: "FEE BREAKDOWN",
            headers: [
                { label: "S.No", property: "sno", width: 50 },
                { label: "Fee Component", property: "component", width: 340 },
                { label: "Amount (INR)", property: "amount", width: 140 }
            ],
            datas: [
                { sno: "1", component: "Academic Fee", amount: `Rs. ${student.academicFee || 0}` },
                { sno: "2", component: "Development & Maintenance", amount: `Rs. ${student.developmentFee || 0}` },
                { sno: "3", component: "Examination Fee", amount: `Rs. ${student.examFee || 0}` },
                { sno: "4", component: "University Fee", amount: `Rs. ${student.universityFee || 0}` }
            ],
        };

        // Add optional fees if they exist
        if (student.cautionMoney > 0) {
            feeBreakdownTable.datas.push({ sno: String(feeBreakdownTable.datas.length + 1), component: "Caution Money", amount: `Rs. ${student.cautionMoney}` });
        }
        if (student.alumniFee > 0) {
            feeBreakdownTable.datas.push({ sno: String(feeBreakdownTable.datas.length + 1), component: "Alumni Fee", amount: `Rs. ${student.alumniFee}` });
        }

        // Add Total Row
        feeBreakdownTable.datas.push({ sno: "", component: "GRAND TOTAL PAID", amount: `Rs. ${student.feeAmount}` });

        doc.font("Helvetica").fontSize(9);
        const tableOptions = { padding: 5, hideHeader: true, title: { fontSize: 11, fontFamily: "Helvetica-Bold" } };
        const breakdownOptions = { padding: 5, hideHeader: false, title: { fontSize: 11, fontFamily: "Helvetica-Bold" } };

        await doc.table(transactionTable, tableOptions);
        doc.moveDown(1);
        await doc.table(studentTable, tableOptions);
        doc.moveDown(1);
        await doc.table(feeBreakdownTable, breakdownOptions);

        doc.moveDown(3);
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center', color: 'gray' });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Server error generating fee receipt' });
    }
};


// ==========================================
// 2. GENERATE HISTORICAL RECEIPT (THE VAULT)
// ==========================================
const generateHistoricalReceipt = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) return res.status(404).json({ message: 'Transaction record not found in the vault.' });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Historical_Receipt_${transaction.enrollmentNumber}.pdf`);

        doc.pipe(res);

        // --- HEADER ---
        doc.fontSize(16).font('Helvetica-Bold').text('SCHOOL OF COMPUTER SCIENCE & INFORMATION TECHNOLOGY', { align: 'center' });
        doc.fontSize(12).text('HISTORICAL FEE RECEIPT', { align: 'center' }); // Labeled as Historical so admins know it was pulled from the vault
        doc.moveDown(2);

        // --- SECTION 1: TRANSACTION DETAILS ---
        const transactionTable = {
            title: "TRANSACTION DETAILS",
            headers: [
                { label: "Detail", property: "col1", width: 140 },
                { label: "Value", property: "col2", width: 140 },
                { label: "Detail", property: "col3", width: 140 },
                { label: "Value", property: "col4", width: 110 }
            ],
            datas: [
                { col1: "Application ID:", col2: transaction.applicationId || "N/A", col3: "Date:", col4: new Date(transaction.datePaid).toLocaleDateString() },
                { col1: "Razorpay Transaction ID:", col2: transaction.feePaymentId || "N/A", col3: "Payment Status:", col4: "SUCCESSFUL" }
            ],
        };

        // --- SECTION 2: STUDENT INFORMATION ---
        const studentTable = {
            title: "STUDENT INFORMATION",
            headers: [
                { label: "Detail", property: "col1", width: 140 },
                { label: "Value", property: "col2", width: 140 },
                { label: "Detail", property: "col3", width: 140 },
                { label: "Value", property: "col4", width: 110 }
            ],
            datas: [
                { col1: "Enrollment No:", col2: transaction.enrollmentNumber, col3: "Course:", col4: transaction.course },
                { col1: "Student Name:", col2: transaction.studentName, col3: "Semester:", col4: `${transaction.semester}` },
                { col1: "Father's Name:", col2: transaction.fatherName || "N/A", col3: "Mother's Name:", col4: transaction.motherName || "N/A" }
            ],
        };

        // --- SECTION 3: FEE BREAKDOWN ---
        const feeBreakdownTable = {
            title: "FEE BREAKDOWN",
            headers: [
                { label: "S.No", property: "sno", width: 50 },
                { label: "Fee Component", property: "component", width: 340 },
                { label: "Amount (INR)", property: "amount", width: 140 }
            ],
            datas: [
                { sno: "1", component: "Academic Fee", amount: `Rs. ${transaction.academicFee || 0}` },
                { sno: "2", component: "Development & Maintenance", amount: `Rs. ${transaction.developmentFee || 0}` },
                { sno: "3", component: "Examination Fee", amount: `Rs. ${transaction.examFee || 0}` },
                { sno: "4", component: "University Fee", amount: `Rs. ${transaction.universityFee || 0}` }
            ],
        };

        if (transaction.cautionMoney > 0) {
            feeBreakdownTable.datas.push({ sno: String(feeBreakdownTable.datas.length + 1), component: "Caution Money", amount: `Rs. ${transaction.cautionMoney}` });
        }
        if (transaction.alumniFee > 0) {
            feeBreakdownTable.datas.push({ sno: String(feeBreakdownTable.datas.length + 1), component: "Alumni Fee", amount: `Rs. ${transaction.alumniFee}` });
        }

        feeBreakdownTable.datas.push({ sno: "", component: "GRAND TOTAL PAID", amount: `Rs. ${transaction.feeAmount}` });

        doc.font("Helvetica").fontSize(9);
        const tableOptions = { padding: 5, hideHeader: true, title: { fontSize: 11, fontFamily: "Helvetica-Bold" } };
        const breakdownOptions = { padding: 5, hideHeader: false, title: { fontSize: 11, fontFamily: "Helvetica-Bold" } };

        await doc.table(transactionTable, tableOptions);
        doc.moveDown(1);
        await doc.table(studentTable, tableOptions);
        doc.moveDown(1);
        await doc.table(feeBreakdownTable, breakdownOptions);

        doc.moveDown(3);
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center', color: 'gray' });

        doc.end();

    } catch (error) {
        console.error('Historical PDF Generation Error:', error);
        res.status(500).json({ message: 'Server error generating historical receipt' });
    }
};


// ==========================================
// 3. GENERATE EXAM ADMIT CARD
// ==========================================
const generateAdmitCard = async (req, res) => {
    try {
        const { enrollmentNumber } = req.params;
        const student = await Student.findOne({ enrollmentNumber: String(enrollmentNumber).toUpperCase() });

        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (!student.examFormSubmitted) return res.status(400).json({ message: 'Cannot generate Admit Card. Exam form not submitted.' });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Admit_Card_${student.enrollmentNumber}.pdf`);

        doc.pipe(res);

        // --- HEADER ---
        doc.fontSize(16).font('Helvetica-Bold').text('SCHOOL OF COMPUTER SCIENCE & INFORMATION TECHNOLOGY', { align: 'center' });
        doc.fontSize(12).text('EXAMINATION ADMIT CARD', { align: 'center' });
        doc.moveDown(2);

        doc.font("Helvetica").fontSize(10);
        const colWidths = [120, 160, 100, 140];

        // --- SECTION 1: STUDENT DETAILS ---
        const studentTable = {
            title: "STUDENT INFORMATION",
            headers: [
                { label: "", property: "col1", width: colWidths[0] },
                { label: "", property: "col2", width: colWidths[1] },
                { label: "", property: "col3", width: colWidths[2] },
                { label: "", property: "col4", width: colWidths[3] }
            ],
            datas: [
                { col1: "Enrollment No:", col2: student.enrollmentNumber, col3: "Course:", col4: student.course },
                { col1: "Student Name:", col2: student.name, col3: "Semester:", col4: `${student.semester}` },
                { col1: "Gender:", col2: student.gender || "N/A", col3: "Status:", col4: "REGULAR" },
                { col1: "Father's Name:", col2: student.fatherName || "N/A", col3: "Mother's Name:", col4: student.motherName || "N/A" }
            ],
        };

        // --- SECTION 2: DYNAMIC SUBJECTS TABLE ---
        const subjects = getSubjectsForStudent(student.course, student.semester);
        const subjectRows = subjects.map((sub, index) => ({
            sno: `${index + 1}`,
            code: sub.code,
            name: sub.name,
            sheet: "", 
            sign: ""   
        }));

        const subjectsTable = {
            title: "SUBJECTS APPEARING FOR",
            headers: [
                { label: "S.No", property: "sno", width: 40 },
                { label: "Subject Code", property: "code", width: 100 },
                { label: "Subject Name", property: "name", width: 200 },
                { label: "Answer Sheet No.", property: "sheet", width: 100 },
                { label: "Invigilator Sign", property: "sign", width: 80 }
            ],
            datas: subjectRows,
        };

        const tableOptions = { padding: 5, hideHeader: false, title: { fontSize: 11, fontFamily: "Helvetica-Bold" } };

        await doc.table(studentTable, { ...tableOptions, hideHeader: true }); 
        doc.moveDown(1);
        await doc.table(subjectsTable, tableOptions); 
        doc.moveDown(2);

        // --- SECTION 3: INSTRUCTIONS ---
        doc.font('Helvetica-Bold').fontSize(11).text('IMPORTANT INSTRUCTIONS:');
        doc.font('Helvetica').fontSize(9);
        doc.moveDown(0.5);
        doc.text('1. Students must carry a valid College Identity Card along with this Admit Card to the examination hall.');
        doc.text('2. Mobile phones, smartwatches, and programmable calculators are strictly prohibited.');
        doc.text('3. Students must report to the examination hall 30 minutes before the scheduled commencement of the exam.');
        doc.text('4. No student will be allowed to leave the hall during the first hour of the examination.');
        
        doc.moveDown(4);

        // --- SIGNATURES ---
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('_______________________', 50, doc.y);
        doc.text('_______________________', 400, doc.y - 12); 
        
        doc.font('Helvetica').fontSize(9);
        doc.text('Signature of Candidate', 65, doc.y + 5);
        doc.text('Controller of Examinations', 410, doc.y - 12);

        doc.end();

    } catch (error) {
        console.error('Admit Card Generation Error:', error);
        res.status(500).json({ message: 'Server error generating admit card' });
    }
};

module.exports = { generateFeeReceipt, generateHistoricalReceipt, generateAdmitCard };