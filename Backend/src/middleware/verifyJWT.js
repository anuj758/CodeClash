const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');

const verifyJWT = async (req, res, next) => {

    try{

        const {token} = req.cookies;
        if(!token){
            throw new Error('Invalid or expired token');
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error('Invalid or expired token');
        }

        const user = await User.findById(_id);

        if(!user){
            throw new Error(`User Doesn't Exist`);
        }

        // checking blocked tokens on redis
        const isBlocked = await redisClient.exists(`token:${token}`);

        if(isBlocked){
            throw new Error('Invalid or expired token');
        }

        req.user = user;

        next();
    }
    catch(err){
        return res.status(401).json({"error" : err.message});
    }
}

module.exports = verifyJWT;