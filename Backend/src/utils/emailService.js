const {Resend} = require('resend');
const fs = require('fs');
const path = require('path');
const resend = new Resend(process.env.RESEND_API_KEY);
const crypto = require("crypto");
const redisClient = require("../config/redis");

const sendVerificationEmail = async (receiverEmail, receiverName) => {

    // create verification link
    const verificationToken = crypto.randomBytes(32).toString("hex");
	const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

	// add token to redis
	const tokenKey = `email:verify:${verificationToken}`;
	await redisClient.set(tokenKey, receiverEmail, {EX: 86400});

    const templatePath = path.join(process.cwd(), 'src', 'emails', 'verificationEmail.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace(/{{userName}}/g, receiverName).replace(/{{link}}/g, verificationLink);

    const { data, error } = await resend.emails.send({
        from: 'Code Clash <no-reply@verifyemail.code-clash.co.in>', 
        to: [receiverEmail],
        subject: 'Verify your CodeClash account',
        html: htmlContent 
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

module.exports = sendVerificationEmail;