// backend/utils/subjectMaster.js

const subjectMaster = {
    // Format: "COURSE_SEMESTER"
    "MCA_1": [
        { code: "CS-4001", name: "Programming in C" },
        { code: "CS-4002", name: "Computer Organization" },
        { code: "CS-4003", name: "Operating Systems" },
    ],
    "MCA_2": [
        { code: "CS-5001", name: "Data Structures using C++" },
        { code: "CS-5002", name: "Database Management Systems" },
        { code: "CS-5003", name: "Software Engineering" },
        { code: "CS-5004", name: "Computer Networks" }
    ],
    "BCA_1": [
        { code: "BC-1001", name: "Fundamentals of IT" },
        { code: "BC-1002", name: "Mathematics I" }
    ]
};

// Helper function to get subjects, with a fallback if they are missing
const getSubjectsForStudent = (course, semester) => {
    const key = `${String(course).toUpperCase()}_${semester}`;
    return subjectMaster[key] || [{ code: "TBD", name: "Subjects Not Assigned Yet" }];
};

module.exports = { getSubjectsForStudent };