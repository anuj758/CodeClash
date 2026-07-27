const mongoose = require('mongoose');
const { Schema } = mongoose; 
const Counter = require('./Counter');

const problemSchema = new Schema({
    problemNumber: {
        type: Number,
        unique: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 2,
        maxLength: 100
    },
    description: {
        type: String,
        required: true,
        minLength: 1
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'easy', 'medium', 'hard'],
        required: true,
    },
    tags: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Tag'
        }],
        validate: [v => Array.isArray(v) && v.length > 0, 'Tags array cannot be empty'],
        required: true
    },
    constraints: {
        type: [
            {
                type: String, 
                trim: true, 
                minLength: 1
            }
        ],
        validate: [v => Array.isArray(v) && v.length > 0, 'constraints array cannot be empty'],
        required: true,
    },
    executionLimits: {
        timeLimit: {
            type: Number,
            required: true,
            default: 2.0,
            min: [1.0, 'Time limit cannot be less than 1.0 seconds'],
            max: [5.0, 'Time limit cannot exceed 5.0 seconds'],
            description: "Execution time limit in seconds (sec)"
        },
        memoryLimit: {
            type: Number,
            required: true,
            default: 262144, // 256 MB in KB (256 * 1024)
            min: [16384, 'Memory limit cannot be less than 16384 KB (16 MB)'],
            max: [1048576, 'Memory limit cannot exceed 1048576 KB (1024 MB / 1 GB)'],
            description: "Execution memory limit in Kilobytes (KB)"
        }
    },
    visibleTestCases:{
        type:[
                {
                    input: { type: String, required: true},
                    output: { type: String, required: true},
                    explanation: { type: String, trim: true}
                }
            ],
        validate: [v => Array.isArray(v) && v.length > 0, "Atleast One visible test case is required"]
    },
    hiddenTestCases: {
        type: [
            {
                input: { type: String, required: true},
                output: { type: String, required: true}
            }
        ],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, 'Hidden test cases are required for code execution']
    },
    referenceSolution: {
        type: [
            {
                languageId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Language',
                    required: true
                },
                code: {
                    type: String,
                    required: true,
                }
            }
        ],
        validate: [v => Array.isArray(v) && v.length > 0, "At least one code template is required"]
    },
    editorial: [
        {
            title: {
                type: String,
                required: true,
                trim: true, 
                minlength: [3, 'Title must be at least 3 characters'],
                maxlength: [50, 'Title cannot exceed 50 characters']
            },
            description: {
                type: String,
                required: true,
                trim: true, 
                minlength: [1, 'Description cannot be empty']
            },
            complexityAnalysis: {
                _id: false,
                time: { type: String, required: true, trim: true },
                space: { type: String, required: true, trim: true }  
            },
            codeImplementations: {
                type: [
                    {
                        languageId: false,
                        languageId: {
                            type: Schema.Types.ObjectId,
                            ref: 'Language',
                            required: true
                        },
                        code: {
                            type: String,
                            required: true
                        }
                    }
                ],
                validate: [
                    (v) => Array.isArray(v) && v.length > 0,
                    'Each editorial approach must include at least one code implementation!'
                ]
            }
        }
    ],
    isPremium: {
        type: Boolean,
        default: false,
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
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    dislikes: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null 
    }
}, { timestamps: true }); 

problemSchema.index({ difficulty: 1 });

problemSchema.pre('validate', async function () {
    const doc = this;

    // Only generate a new ID if the document is brand new
    if (doc.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'problemId_sequence' },
            { $inc: { seq: 1 } },        // Increments the counter by 1
            { new: true, upsert: true }  // Creates sequence document if it doesn't exist
        );

        doc.problemNumber = counter.seq; // Assigns 1, 2, 3...
    }
});

module.exports = mongoose.models.Problem || mongoose.model('Problem', problemSchema);