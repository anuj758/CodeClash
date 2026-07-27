const redisClient = require("../config/redis");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
	validatetName,
	validateUserName,
	validateEmail,
	validatePassWord,
} = require("../models/validators/user");
const sendVerificationEmail = require("../utils/emailService");

const userRegister = async (req, res) => {
  	try{
		// sanitize the data
		const data = {
			name: validatetName(req.body.name),
			username: validateUserName(req.body.username),
			emailId: validateEmail(req.body.emailId),
			password: validatePassWord(req.body.password),
		};
		
		const existingUser = await User.findOne({
            $or: [
                { username: data.username },
                { emailId: data.emailId }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: (existingUser.emailId === data.emailId) ? "Account exist, please login to access your account" : "Username already in use" 
            });
        }

		data.password = await bcrypt.hash(data.password, 10);
		const user = await User.create(data);

		const reply = {
			_id: user._id,
			username: user.username,
			emailId: user.emailId,
			role: user.role
		}

		const sessionId = crypto.randomBytes(32).toString("hex");
		const redisKey = `sessionId:${sessionId}`;
		await redisClient.set(redisKey, user.username, {EX: 1200});
		
		// send verification email
		await sendVerificationEmail(user.emailId, user.name);

		res.status(201).json({ 
			message: "Registration successful! Please check your email.",
			sessionId,
			user: reply
		});
	}catch(err){
		res.status(400).json({ message: err.message });
	}
};

const login = async (req, res) => {
  	try {
		let identity = req.body.identity;
		const password = req.body.password;
		
		if (!identity || !password) {
			throw new Error("Invalid Credentials");
		}
		
		const isEmailInput = identity.includes("@");
		try{
			if(isEmailInput){
				identity = validateEmail(identity);
			}
			else{
				identity = validateUserName(identity);
			}
		} catch(err){
			throw new Error("Invalid Credentials");
		}
		
		let user;
		if(isEmailInput) user = await User.findOne({ emailId: identity });
		else user = await User.findOne({ username: identity });
		

		if (!user) {
			throw new Error("Invalid Credentials");
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			throw new Error("Invalid Credentials");
		}

		const reply = {
			_id: user._id,
			username: user.username,
			emailId: user.emailId,
			isVerified: user.isVerified,
			role: user.role
		}
		
		// user is unverified
		if(!user.isVerified){
			const sessionId = crypto.randomBytes(32).toString("hex");
			const redisKey = `sessionId:${sessionId}`;
			await redisClient.set(redisKey, user.username, {EX: 1200});

			await sendVerificationEmail(user.emailId, user.name);

			return res.status(403).json({ 
				user: reply,
                message: "Account unverified. A confirmation link has been sent to your email." 
            });
		}
		

		const token = jwt.sign(
			{ _id: user._id, username: user.username, role: user.role },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "7d" },
		);

		res.cookie("token", token, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

    	return res.status(200).json({ 
			user: reply,
			message: "Logged In Successfully" });
  	} catch (err) {
		const invalidCredentials = err.message.includes("Invalid Credentials");
    	return res.status(invalidCredentials ? 400 : 500).json({ message: err.message });
  	}
};

const logout = async (req, res) => {
  let redisFailed = false;

  const token = req.cookies.token;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
      // block the token
      await redisClient.set(`token:${token}`, "Blocked");
      // add expiry
      await redisClient.expireAt(`token:${token}`, payload.exp);
    } catch (err) {
      // If it's a Redis error, trip our warning flag
      if (
        err.name !== "JsonWebTokenError" &&
        err.name !== "TokenExpiredError"
      ) {
        redisFailed = true;
        console.error(`[SYSTEM ERROR] Redis failed: ${err.message}`);
      }
    }
  }

  // ALWAYS secure the local browser by dropping the dead cookie
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(0),
  });

  if (redisFailed) {
    // We tell the client it succeeded locally, but failed globally
    return res.status(500).json({
      message: "Logged out locally, but server synchronization failed.",
    });
  }

  return res.status(200).json({ message: "Logged Out Successfully" });
};

const verifyEmail = async (req, res) => {
	try{
		const {token} = req.body;
		if (!token) {
      		return res.status(400).json({ message: "Verification token is required." });
    	}

		const redisKey = `email:verify:${token}`;
    	const emailId = await redisClient.get(redisKey);

		if (!emailId) {
			return res.status(400).json({ message: "Invalid or expired verification link." });
		}

		const user = await User.findOne({ emailId: emailId });
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		if (user.isVerified) {
			await redisClient.del(redisKey);
			return res.status(400).json({ message: "Email is already verified." });
		}

		user.isVerified = true;
		await user.save();

		// remove token from redis
		await redisClient.del(redisKey);

		return res.status(200).json({ 
			message: "Email successfully verified! You can now log in." });
	}catch(err){
		return res.status(500).json({ message: "Internal server error during verification." });
	}
};

const isUserNameAvailable = async (req, res) => {
    try {
        const username = validateUserName(req.params.username);

        const userExists = await User.exists({ username: username});

        if (userExists) {
            return res.status(200).json({ available: false, message: "Username is already taken." });
        }

        return res.status(200).json({ available: true, message: "Username is available!" });
    } catch (err) {
		const isValidationError = err.message.includes("Invalid username");
        return res.status(isValidationError ? 400 : 500).json({message: err.message});
    }
};

const resendVerificationLink = async (req, res) => {
    try {
        const emailId = validateEmail(req.body.emailId);

        const user = await User.findOne({emailId: emailId});

        if (!user) {
            return res.status(200).json({ 
                message: "A fresh verification link has been sent to your inbox.." 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This account is already verified. Please log in." });
        }

        // Rate Limiting Check
        const existingToken = await redisClient.get(`limit:resend:verifyEmail:${user.username}`);
        if (existingToken) {
            return res.status(429).json({ 
                message: "Please wait a few minutes before requesting another verification email." 
            });
        }

		// generate a session id
		const sessionId = crypto.randomBytes(32).toString("hex");
		const redisKey = `sessionId:${sessionId}`;
		await redisClient.set(redisKey, user.username, {EX: 1200});

        // save the rate limiting token for 2 minutes
        await redisClient.set(`limit:resend:verifyEmail:${user.username}`, 'locked', { EX: 120 });

        // send the email via resend
        await sendVerificationEmail(user.emailId, user.name);

        return res.status(200).json({ 
            message: "A fresh verification link has been sent to your inbox.",
			sessionId
        });

    } catch (err) {
        console.error("Resend endpoint error:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const checkVerificationStatus = async (req, res) => {
	try{
		const sessionId = req.body.sessionId;

		if(!sessionId){
			return res.status(400).json({message: 'Invalid or Expired Session Id!'});
		}

		const redisKey = `sessionId:${sessionId}`;
		const username = await redisClient.get(redisKey);

		if(!username){
			return res.status(400).json({message: 'Invalid or Expired Session Id!'});
		}

		const user = await User.findOne({username: username});
		if(!user.isVerified){
			return res.status(200).json({message: 'unverified user', isVerified: false});
		}

		await redisClient.del(redisKey);

		const JWToken = jwt.sign(
			{ _id: user._id, username: user.username, role: user.role },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "7d" },
		);

		res.cookie("token", JWToken, {
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return res.status(200).json({message: 'verified', isVerified: true});

	}catch(err){
		return res.status(500).json({message: err.message});
	}

};

const checkAuth = (req, res) => {
	const user = {
			_id: req.user._id,
			username: req.user.username,
			emailId: req.user.emailId,
			isVerified: req.user.isVerified,
			role: req.user.role
	}
	res.status(200).json({
		user,
		message: 'Valid User'
	});
};

// const changePassword = (req, res) => {
// 	try{
// 		const emailId = req.body.emailId;

// 		if(!emailId){
// 			return res.status(400).json({message: "Enter a valid Email Id."});
// 		}


// 	}catch(err){

// 	}
// }

module.exports = {
	userRegister,
	login,
	logout,
	verifyEmail,
	isUserNameAvailable,
	resendVerificationLink,
	checkAuth,
	checkVerificationStatus
};
