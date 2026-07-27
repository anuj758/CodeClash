// Admin Verification Middleware
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin rights required." });
    }
    next();
};

// Paid/Premium Verification Middleware
const verifyPaidOrAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'paid' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: "This feature is locked. Upgrade to Paid tier." });
    }
    next();
};


module.exports = {verifyAdmin, verifyPaidOrAdmin};