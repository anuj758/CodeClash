const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true 
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Comment', commentSchema);