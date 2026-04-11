const jwt = require('jsonwebtoken');

// Middleware to protect Admin routes
const protectAdmin = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1]; // Remove "Bearer " from the string
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }
            
            req.user = decoded; // Attach user info to the request
            next(); // Proceed to the actual route controller
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware to protect Student routes
const protectStudent = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.role !== 'student') {
                return res.status(403).json({ message: 'Access denied. Student only.' });
            }
            
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protectAdmin, protectStudent };