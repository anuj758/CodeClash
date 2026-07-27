const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 30,
        trim: true,
        match: [/^[^0-9]*$/, 'Name must not contain any numbers']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        immutable: true,
        match: [/^[a-z][a-z0-9_]*$/, 'Username must start with a lowercase letter and contain only a-z, 0-9, and _']
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false 
    },
    role: {
        type: String,
        enum: ['admin', 'paid', 'user'],
        default: 'user'
    },
    profileImage: {
        url: {
            type: String,
            default: '' 
        },
        publicId: {
            type: String,
            default: null
        }
    },
    bio: {
        type: String,
        trim: true,
        maxLength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    stats: {
        totalProblemSolved: {
            type: Number,
            default: 0,
            min: 0
        },
        totalSubmissions: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        totalAccepted: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        difficultyCount: {
            beginner: { 
                type: Number, 
                default: 0, 
                min: 0 
            },
            easy: {
                type: Number, 
                default: 0, 
                min: 0 
            },
            medium: { 
                type: Number, 
                default: 0, 
                min: 0 
            },
            hard: { 
                type: Number, 
                default: 0, 
                min: 0 
            }
        },
        rankScore: {
            type: Number,
            default: 0,
            index: true 
        }
    }
}, { timestamps: true });


module.exports = mongoose.models.User || mongoose.model('User', userSchema);