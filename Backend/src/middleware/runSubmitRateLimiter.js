const redisClient = require('../config/redis');

const runSubmitRateLimiter = async (req, res, next) => {
    try {
        const user = req.user;

        const key = `user:rate:${user._id}`;

        const val = await redisClient.get(key);

        if (val) {
            return res.status(429).json({ 
                success: false, 
                message: 'Too many requests. Please wait a moment before submitting again.' 
            });
        }

        await redisClient.set(key, '1', { EX: 10 });    // 10sec

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = runSubmitRateLimiter;