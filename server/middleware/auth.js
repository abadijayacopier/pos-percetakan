const jwt = require('jsonwebtoken');

// Middleware Verifikasi Token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Akses Ditolak! Token tidak ditemukan.' });
    }

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Akses Ditolak! Token tidak valid.' });
    }
};

// Middleware Khusus Hak Akses Role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Akses Dilarang! Anda tidak memiliki izin untuk tindakan ini.' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    requireRole
};
