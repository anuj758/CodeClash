const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true
    },
    languageId: {
        type: Schema.Types.ObjectId,
        ref: 'Language',
        required: true
    },
    status: {
        id: {
            type: Number,
            required: true,
            min: 1,
            max: 14
        },
        description: {
            type: String,
            required: true,
            enum: [
                'In Queue',
                'Processing',
                'Accepted',
                'Wrong Answer',
                'Time Limit Exceeded',
                'Compilation Error',
                'Runtime Error (SIGSEGV)',
                'Runtime Error (SIGXFSZ)',
                'Runtime Error (SIGFPE)',
                'Runtime Error (SIGABRT)',
                'Runtime Error (NZEC)',
                'Runtime Error (Other)',
                'Internal Error',
                'Exec Format Error'
            ]
        }
    },
    code: {
        type: String,
        required: true
    },
    time: {
        type: Number, // Execution time in seconds (e.g., 0.042)
        default: 0,
        min: 0
    },
    memory: {
        type: Number, // Memory consumed in KB
        default: 0,
        min: 0
    },
    // Test case counts
    acceptedTestCases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTestCases: {
        type: Number,
        default: 0,
        min: 0
    },
    // if not accepted
    failedTestCase: {
        input: {
            type: String,
            default: null
        },
        expectedOutput: {
            type: String,
            default: null
        },
        actualOutput: {
            type: String,
            default: null
        },
        compileOutput: {
            type: String,
            default: ""
        },
        stderr: {
            type: String,
            default: ""
        }
    }
}, { timestamps: true });

// Compound Indexes for fast database lookups
submissionSchema.index({ userId: 1, problemId: 1, 'status.description': 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);