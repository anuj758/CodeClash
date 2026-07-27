const mongoose = require('mongoose');
const { Schema } = mongoose;

const problemInteractionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    status: {
        type: String,
        enum: ['liked', 'disliked', 'none'],
        default: 'none',
        required: true
    }
}, { timestamps: true });


problemInteractionSchema.index({ userId: 1, problemId: 1 }, { unique: true });
problemInteractionSchema.index({ problemId: 1, status: 1 });        // for calculating like/dislike

module.exports = mongoose.model('ProblemInteraction', problemInteractionSchema);