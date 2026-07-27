const mongoose = require('mongoose');
const { Schema } = mongoose;

const tagSchema = new Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        lowercase: true 
    },
    addedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);