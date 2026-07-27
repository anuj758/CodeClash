const mongoose = require('mongoose');
const { Schema } = mongoose;

const languageSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true // e.g., "C++", "Python", "Java"
    },
    version: {
        type: String,
        required: true,
        trim: true // e.g., "GCC 13.2", "3.10.5", "OpenJDK 17"
    },
    monacoLanguage: {
        type: String,
        required: true,
        lowercase: true,
        trim: true // e.g., "cpp", "python", "java",
    },
    judge0LanguageId: {
        type: Number,
        required: true,
        unique: true,
        index: true // Numeric Judge0 language ID e.g., 54, 71, 62
    },
    defaultTemplate: {
        type: String,
        default: "" // demo code
    },
    addedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    }
}, { timestamps: true });

// unique combination of name + version
languageSchema.index({ name: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Language', languageSchema);