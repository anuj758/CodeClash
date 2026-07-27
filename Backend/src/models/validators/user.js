const validator = require('validator');

const validatetName = (name) => {
    if (!name || typeof name !== "string") {
        throw new Error("Name must be between 3 and 30 characters.");
    }
    
    const trimmedName = name.trim();
    if (!validator.isLength(trimmedName, { min: 3, max: 30 })) {
        throw new Error("Name must be between 3 and 30 characters.");
    }

    const isValidName = validator.matches(trimmedName, /^[^0-9]*$/); 
    if (!isValidName) {
        throw new Error("Name should not contain numbers");
    }

    return trimmedName;
};

const validateUserName = (username) => {
    if (!username || typeof username !== "string" || !validator.isLength(username, { min: 3, max: 20 })) {
        throw new Error('Invalid username, it should contain 3 to 20 chars!');
    }
   
    const firstChar = username.charAt(0);
    if (!/[a-z]/.test(firstChar)) {
        throw new Error('Invalid username, it must start with a lowercase letter!');
    }
    
    const hasUppercase = /[A-Z]/.test(username);
    if (!validator.isAlphanumeric(username, 'en-US', { ignore: '_' }) || hasUppercase) {
        throw new Error('Invalid username, characters allowed are a-z, 0-9, _ only');
    }
    
    return username;
};

const validateEmail = (emailId) => {
    if (!emailId || typeof emailId !== 'string') {
        throw new Error('Invalid Email Address');
    }

    const trimmedEmail = emailId.trim();
    if (!validator.isEmail(trimmedEmail)) {
        throw new Error('Invalid Email Address');
    }
    
    return validator.normalizeEmail(trimmedEmail);
};

const validatePassWord = (password) => {
    if (!password || typeof password !== "string") {
        throw new Error("Password is required and must be strong.");
    }

    const trimmedPassword = password.trim();
    if (!validator.isStrongPassword(trimmedPassword)) {
        throw new Error("Password is required and must be strong.");
    }
    
    return trimmedPassword;
};

const validateBio = (bio) => {
    if (bio === undefined || bio === null || bio === '') {
        return '';
    }

    if (typeof bio !== "string") {
        throw new Error('Invalid Bio, should not exceed 500 chars!');
    }

    const trimmedBio = bio.trim();
    if (!validator.isLength(trimmedBio, { max: 500 })) {
        throw new Error('Invalid Bio, should not exceed 500 chars!');
    }
    
    return trimmedBio;
};


module.exports = {
    validatetName,
    validateUserName,
    validateEmail, 
    validatePassWord,
    validateBio
}