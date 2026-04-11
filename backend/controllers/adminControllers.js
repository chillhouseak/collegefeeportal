const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');
// Admin Registration Logic with Secret Key
const adminRegister = async (req, res) => {
    const { email, password, adminSecret } = req.body; 

    try {
        if (!email || !password || !adminSecret) {
            return res.status(400).json({ message: 'Please provide email, password, and the secret key' });
        }

        if (adminSecret !== process.env.ADMIN_CREATION_SECRET) {
            return res.status(403).json({ message: 'Unauthorized: Invalid Admin Creation Key' });
        }

        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'An admin account with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({ 
            email, 
            password: hashedPassword 
        });

        res.status(201).json({
            message: 'Admin registered successfully. You can now log in.',
            admin: { id: admin._id, email: admin.email }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } 
        );

        res.status(200).json({
            message: 'Admin login successful',
            admin: {
                id: admin._id,
                email: admin.email,
                role: 'admin',
                token: token 
            }
        });
        
    } catch (error) { 
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// THE FINAL, INDESTRUCTIBLE 5-COLUMN UPLOADER
const uploadStudentData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Read the Excel File as a BLIND GRID (Ignores header names)
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        
        // { header: 1 } forces it to read as an array of rows
        const rawGrid = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // Remove the very first row (the headers)
        const dataRows = rawGrid.slice(1);

        const bulkOps = [];

        // Loop through the grid
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];

            // FETCHING EXACTLY THE 14 COLUMNS FROM EXCEL (Indexes 0 to 13):
            const rawEnrollment = row[0]; // Column A
            const name = row[1];          // Column B
            const gender = row[2];        // Column C
            const fatherName = row[3];    // Column D
            const motherName = row[4];    // Column E
            const course = row[5];        // Column F
            const semester = row[6];      // Column G
            
            // FEES
            const feeAmount = row[7];      // Column H
            const academicFee = row[8];    // Column I
            const developmentFee = row[9]; // Column J
            const examFee = row[10];       // Column K
            const universityFee = row[11]; // Column L
            const cautionMoney = row[12];  // Column M
            const alumniFee = row[13];     // Column N

            // If Column A is completely blank, skip this row
            if (!rawEnrollment || String(rawEnrollment).trim() === '') continue;

            // FIX: Force Enrollment and Course to UPPERCASE to prevent case-sensitive bugs
            const enrollmentNumber = String(rawEnrollment).trim().toUpperCase();
            const cleanCourse = String(course || 'Unknown').trim().toUpperCase();
            const cleanSemester = parseInt(semester, 10) || 1;

            // Prepare the database update
            bulkOps.push({
                updateOne: {
                    filter: { enrollmentNumber: enrollmentNumber },
                    update: {
                        $set: {
                            // Basic Details
                            enrollmentNumber: enrollmentNumber,
                            name: String(name || 'Unknown').trim(),
                            gender: String(gender || 'Not Specified').trim(),
                            fatherName: String(fatherName || 'Not Provided').trim(),
                            motherName: String(motherName || 'Not Provided').trim(),
                            course: cleanCourse,
                            semester: cleanSemester,
                            
                            // Fee Details (Defaults to 0 if cell is blank)
                            feeAmount: parseInt(feeAmount, 10) || 0,
                            academicFee: parseInt(academicFee, 10) || 0,
                            developmentFee: parseInt(developmentFee, 10) || 0,
                            examFee: parseInt(examFee, 10) || 0,
                            universityFee: parseInt(universityFee, 10) || 0,
                            cautionMoney: parseInt(cautionMoney, 10) || 0,
                            alumniFee: parseInt(alumniFee, 10) || 0,

                            // Reset portal status for the new upload
                            hasPaidFee: false,
                            examFormSubmitted: false
                        }
                    },
                    upsert: true // Create if they don't exist, update if they do
                }
            });
        }

        // Clean up the file
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        // If no valid data was found
        if (bulkOps.length === 0) {
            return res.status(400).json({ message: 'No valid data found in Column A.' });
        }

        // Save to MongoDB
        await Student.bulkWrite(bulkOps);

        res.status(200).json({ message: `Success! Saved ${bulkOps.length} students to the database.` });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server crashed during upload.' });
    }
};



// Get Students with Filtering
const getAllStudents = async (req, res) => {
    try {
        const { course, semester } = req.query; 
        let query = {};

        // Added upper case here as well just in case the query is lowercase
        if (course) query.course = course.toUpperCase(); 
        if (semester) query.semester = Number(semester);

        const students = await Student.find(query).sort({ enrollmentNumber: 1 });
        
        res.status(200).json({
            count: students.length,
            students: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error while fetching student records' });
    }
};// NEW: Delete a single student
const deleteStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Find the student by their database ID and delete them
        const deletedStudent = await Student.findByIdAndDelete(studentId);
        
        if (!deletedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error while deleting student' });
    }
};
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ key: 'global_settings' });
        if (!settings) {
            settings = await Settings.create({ key: 'global_settings', isExamFormOpen: false });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

// Flip the switch!
const toggleExamFormStatus = async (req, res) => {
    try {
        let settings = await Settings.findOne({ key: 'global_settings' });
        if (!settings) {
            settings = await Settings.create({ key: 'global_settings', isExamFormOpen: false });
        }
        
        // Reverse the current status (true becomes false, false becomes true)
        settings.isExamFormOpen = !settings.isExamFormOpen;
        await settings.save();
        
        res.status(200).json({ 
            message: `Exam forms are now ${settings.isExamFormOpen ? 'OPEN' : 'CLOSED'}`, 
            isExamFormOpen: settings.isExamFormOpen 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling exam form status' });
    }
};
// NEW: Delete All Students for a specific course/sem
const deleteAllStudents = async (req, res) => {
    try {
        const { course, semester } = req.query;
        if (!course || !semester) {
            return res.status(400).json({ message: "Course and semester are required." });
        }

        await Student.deleteMany({ 
            course: String(course).toUpperCase(), 
            semester: parseInt(semester, 10) 
        });

        res.status(200).json({ message: "All records deleted successfully." });
    } catch (error) {
        console.error('Delete All Error:', error);
        res.status(500).json({ message: "Server error deleting records." });
    }
};

// NEW: Generate and Download Excel File
const downloadStudentExcel = async (req, res) => {
    try {
        const { course, semester } = req.query;
        
        // Fetch students based on course and semester
        const students = await Student.find({ 
            course: String(course).toUpperCase(), 
            semester: parseInt(semester, 10) 
        }).lean();

        // Format the data exactly how you want it to appear in the exported Excel file
        const excelData = students.map(student => ({
            'Enrollment Number': student.enrollmentNumber,
            'Student Name': student.name,
            'Gender': student.gender,
            'Father Name': student.fatherName,
            'Mother Name': student.motherName,
            'Course': student.course,
            'Semester': student.semester,
            'Total Fee': student.feeAmount,
            'Academic Fee': student.academicFee,
            'Development Fee': student.developmentFee,
            'Exam Fee': student.examFee,
            'University Fee': student.universityFee,
            'Caution Money': student.cautionMoney,
            'Alumni Fee': student.alumniFee,
            'Fee Status': student.hasPaidFee ? 'PAID' : 'PENDING',
            'Exam Form': student.examFormSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'
        }));

        const xlsx = require('xlsx'); // Import the library you already have
        
        // Convert JSON to an Excel worksheet
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Student Data");
        
        // Create a buffer to send over the network
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers so the browser knows it's downloading an Excel file
        res.setHeader('Content-Disposition', `attachment; filename="${course}_Sem${semester}_Records.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        res.send(buffer);
    } catch (error) {
        console.error('Download Excel Error:', error);
        res.status(500).json({ message: "Server error generating Excel file." });
    }
};






module.exports = { uploadStudentData, getAllStudents, adminLogin, adminRegister,deleteStudent,getSettings, toggleExamFormStatus, deleteAllStudents, 
    downloadStudentExcel };