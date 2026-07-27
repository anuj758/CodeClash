const Language = require('../models/Language');
const Tag = require('../models/Tag');

const getAllLanguages = async (req, res) => {
    try {
        const allLanguages = await Language.find({})
            .select('-addedBy -createdAt -updatedAt')
            .sort({ name: 1 }) 
            .lean();          

        return res.status(200).json({ allLanguages }); 
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getAllTags = async (req, res) => {
    try {
        const allTags = await Tag.find({})
            .select('-addedBy -createdAt -updatedAt')
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({ allTags }); 
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllLanguages, getAllTags };