const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Problem = require('../models/problem');
const {validateUserName, validateEmail} = require('../models/validators/user')
const { isAccepted } = require('../utils/judge');
const Language = require('../models/Language');
const Tag = require('../models/Tag')
const { getMonacoLanguage } = require('../utils/monacoLanguages')
const axios = require('axios');
const mongoose = require('mongoose');
const prepareAndValidateProblem = require('../utils/prepareAndValidateProblem');


const promoteUserToAdmin = async (req, res) => {
    try {
        let { emailId, username } = req.body;

        try{
            emailId = validateEmail(emailId);
            username = validateUserName(username);
        }
        catch(err){
            return res.status(400).json({
                success: false,
                message: 'Invalid Email and Username'
            });
        }
        
        const targetUser = await User.findOne({
            emailId: emailId,
            username: username
        });

        
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'No user found matching both that email and username. Please check for typos.'
            });
        }

        
        if (targetUser.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin.'
            });
        }

        
        targetUser.role = 'admin';
        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: `Successfully promoted ${targetUser.username} (${targetUser.email}) to Admin.`
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to promote user',
            error: err.message
        });
    }
};


const demoteAdminToUser = async (req, res) => {
    try {
        let { emailId, username } = req.body;

        try {
            emailId = validateEmail(emailId);
            username = validateUserName(username);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Email or Username format.'
            });
        }

        // 1. Fetch target admin
        const targetAdmin = await User.findOne({
            emailId: emailId,
            username: username,
            role: 'admin'
        });

        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: 'No active admin found matching that email and username.'
            });
        }

        // 2. Self-demotion guard
        // (Automatically guarantees at least 1 other admin remains: req.user!)
        if (targetAdmin._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot demote yourself. Ask another admin to demote you.'
            });
        }

        // 3. Demote and save
        targetAdmin.role = 'user';
        await targetAdmin.save();

        return res.status(200).json({
            success: true,
            message: `Successfully demoted admin ${targetAdmin.username} (${targetAdmin.emailId}) to user.`
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to demote admin',
            error: err.message
        });
    }
};


const createProblem = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(req.body);
        // 1. Run shared validation & Judge0 verification
        const problemData = await prepareAndValidateProblem(req.body, userId);
        
        // 2. Set creation metadata
        problemData.createdBy = userId;

        // 3. Save to database
        const newProblem = new Problem(problemData);
        const savedProblem = await newProblem.save();

        return res.status(201).json({
            success: true,
            message: "Problem created successfully",
            problem: savedProblem
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

const createProblemsBatch = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problems } = req.body; // Expecting an array of problem objects

        if (!Array.isArray(problems) || problems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid input: 'problems' must be a non-empty array."
            });
        }

        // Process all problems concurrently
        const results = await Promise.allSettled(
            problems.map(async (rawProblem, index) => {
                // 1. Run shared validation & Judge0 verification
                const problemData = await prepareAndValidateProblem(rawProblem, userId);
                
                // 2. Set creation metadata
                problemData.createdBy = userId;

                // 3. Save to database
                const newProblem = new Problem(problemData);
                const savedProblem = await newProblem.save();

                return { index, problem: savedProblem };
            })
        );

        // Separate successful creations from errors
        const created = [];
        const failed = [];

        results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                created.push(result.value.problem);
            } else {
                failed.push({
                    index: idx,
                    title: problems[idx]?.title || `Problem at index ${idx}`,
                    reason: result.reason?.message || 'Failed to process'
                });
            }
        });

        // Determine appropriate HTTP status code based on outcome
        const statusCode = created.length > 0 ? (failed.length > 0 ? 207 : 201) : 400;

        return res.status(statusCode).json({
            success: created.length > 0,
            message: `Batch creation complete: ${created.length} created, ${failed.length} failed.`,
            summary: {
                total: problems.length,
                successCount: created.length,
                failureCount: failed.length
            },
            createdProblems: created,
            failedProblems: failed
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const getProblemAllData = async (req, res) => {
    try {
        const { problemNumber } = req.params;
        const parsedProblemNumber = parseInt(problemNumber, 10);

        if (isNaN(parsedProblemNumber)) {
            return res.status(400).json({ success: false, message: "Invalid problem number" });
        }

        const problem = await Problem.findOne({ problemNumber: parsedProblemNumber })
            .select('problemNumber title description difficulty tags constraints executionLimits visibleTestCases hiddenTestCases referenceSolution editorial')
            .populate('tags', 'name')
            .populate('referenceSolution.languageId', 'name')
            .lean();

        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem does not exist!" });
        }

        return res.status(200).json({ success: true, problem });

    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch problem data", error: err.message });
    }
};

const updateProblem = async (req, res) => {
    try {
        const { problemNumber } = req.params;
        const userId = req.user._id;

        // 1. Validate that problemNumber is a valid integer
        const parsedProblemNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedProblemNumber)) {
            return res.status(400).json({ success: false, message: "Invalid problem number" });
        }

        // 2. Fetch the existing problem document
        const existingProblem = await Problem.findOne({ problemNumber: parsedProblemNumber });
        if (!existingProblem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }

        // 3. Run shared validation & Judge0 verification on updated fields
        const problemData = await prepareAndValidateProblem(req.body, userId);

        // 4. Set update metadata
        problemData.updatedBy = userId;

        // 5. Update properties on existing document and save 
        Object.assign(existingProblem, problemData);
        const updatedProblem = await existingProblem.save();

        return res.status(200).json({
            success: true,
            message: "Problem updated successfully",
            problem: updatedProblem
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


const deleteProblem = async (req, res) => {
    try {
        const problemNumber = req.body.problemNumber;

        if(!problemNumber){
            return res.status(400).json({'message': 'Invalid Problem Number!'});
        }

        const result = await Problem.deleteOne({ problemNumber });

        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Problem not found." });
        }

        return res.status(200).json({ message: "Problem deleted successfully." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const addLanguage = async (req, res) => {
    try {
        const { judge0LanguageId, defaultTemplate } = req.body;

        if (!judge0LanguageId || !defaultTemplate) {
            return res.status(400).json({ 
                success: false, 
                message: "Both judge0LanguageId and defaultTemplate are required." 
            });
        }
        
        let judge0Data;
        try {
            const response = await axios.get(`${process.env.JUDGE0}/languages/${judge0LanguageId}`);
            judge0Data = response.data;
        } catch (err) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid judge0LanguageId: ${judge0LanguageId}` 
            });
        }

        const monacoLanguage = getMonacoLanguage(parseInt(judge0LanguageId, 10));

       
        const fullName = judge0Data.name; // e.g. "C++ (GCC 9.2.0)"
        const [rawName, rawVersion] = fullName.split('(');
        
        const name = rawName.trim();
        const version = rawVersion ? rawVersion.replace(')', '').trim() : '';

        const newLanguage = new Language({
            name,
            version,          
            judge0LanguageId,
            monacoLanguage,
            defaultTemplate, 
            addedBy: req.user._id
        });

        await newLanguage.save();

        return res.status(201).json({
            success: true,
            message: "Language added successfully",
            language: newLanguage
        });

    } catch (err) {
        // Catch MongoDB duplicate index error cleanly
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `Language with Judge0 ID ${req.body.judge0LanguageId} already exists.`
            });
        }

        return res.status(500).json({ success: false, message: err.message });
    }
};

const deleteLanguage = async (req, res) => {
    try {
        const { _id } = req.body;

        // 1. Validate ObjectId format
        if (!_id || typeof _id !== 'string' || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing Language ID.'
            });
        }

        // 2. Safeguard: Check if any problems reference this language in codeTemplates
        const isLanguageInUse = await Problem.exists({ 'referenceSolution.languageId': _id });
        if (isLanguageInUse) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete language because it is assigned to code templates in one or more problems.'
            });
        }

        // 3. Find and delete the language
        const deletedLanguage = await Language.findByIdAndDelete(_id);

        if (!deletedLanguage) {
            return res.status(404).json({
                success: false,
                message: 'Language not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Language "${deletedLanguage.name} ${deletedLanguage.version}" deleted successfully.`,
            language: deletedLanguage
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete language',
            error: err.message
        });
    }
};

const addTag = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or missing tag name.' });
        }

        // Convert to trimmed lowercase string
        const cleanName = name.trim().toLowerCase();

        // 1. Check if tag already exists (direct string match since everything is lowercase)
        const existingTag = await Tag.findOne({ name: cleanName });

        if (existingTag) {
            return res.status(400).json({
                success: false,
                message: `Tag "${cleanName}" already exists.`
            });
        }

        // 2. Create and save new tag in lowercase
        const tagData = new Tag({
            name: cleanName,
            addedBy: req.user._id
        });

        const savedTag = await tagData.save();

        return res.status(201).json({
            success: true,
            message: 'Tag added successfully',
            tag: savedTag
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to add tag',
            error: err.message
        });
    }
};

const deleteTag = async (req, res) => {
    try {
        const { _id } = req.body;

        // 1. Validate ObjectId format
        if (!_id || typeof _id !== 'string' || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing Tag ID.'
            });
        }

        // 2. Safeguard: Check if any problems are using this tag
        const isTagInUse = await Problem.exists({ tags: _id });
        if (isTagInUse) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete tag because it is currently assigned to one or more problems.'
            });
        }

        // 3. Delete the tag
        const deletedTag = await Tag.findByIdAndDelete(_id);

        if (!deletedTag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Tag "${deletedTag.name}" deleted successfully.`,
            tag: deletedTag
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete tag',
            error: err.message
        });
    }
};

module.exports = {promoteUserToAdmin, demoteAdminToUser, createProblem, getProblemAllData, deleteProblem, updateProblem, addLanguage, deleteLanguage, addTag, deleteTag, createProblemsBatch};