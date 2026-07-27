const validator = require('validator');
const Tag = require('../Tag');
const mongoose = require('mongoose');
const Language = require('../Language');

const validateTitle = (title) => {
    if(!title || typeof title !== "string"){
        throw new Error('Provide a valid title field!');
    }
    const trimmedTitle = title.trim();
    if (!validator.isLength(trimmedTitle, { min: 2, max: 100 })) {
        throw new Error("Problem title must be between 2 and 100 characters.");
    }
    return trimmedTitle;
}

const validateDescription = (description) => {
    if(!description || typeof description !== "string"){
        throw new Error('Provide a valid description field');
    }

    const trimmedDescription = description.trim();
    if(trimmedDescription.length < 1){
        throw new Error('Empty description for a problem!');
    }
    return trimmedDescription;
}

const validateDifficulty = (difficulty) => {
    const validDifficulty = ['beginner', 'easy', 'medium', 'hard'];
    if(!difficulty || typeof difficulty !== "string" || !validDifficulty.includes(difficulty.toLowerCase())){
        throw new Error('Difficulty should be one of them beginner, easy, medium, hard');
    }
    
    
    return difficulty.toLowerCase();
}

const validateTags = async (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Tags are missing');
    }

    const isValidObjectIds = tags.every(
        (tag) => typeof tag === "string" && mongoose.Types.ObjectId.isValid(tag)
    );
    
    if (!isValidObjectIds) {
        throw new Error('One or more provided tag IDs have an invalid format.');
    }

    
    const uniqueTagIds = [...new Set(tags)];

    const existingTags = await Tag.find({
        _id: { $in: uniqueTagIds }
    }).select('_id');

    if (existingTags.length !== uniqueTagIds.length) {
        throw new Error('One or more provided tags do not exist in the database.');
    }

    
    return existingTags.map(tag => tag._id);
};

const validateConstraints = (constraints) => {
    if(!Array.isArray(constraints) || constraints.length === 0){
        throw new Error('At least provide 1 contraint');
    }

    const allStrings = constraints.every((constraint) => typeof constraint === "string");
    if(!allStrings){
        throw new Error('One or more contraints are invalid!');
    }

    const cleanConstraints = constraints
        .map((constraint) => constraint.trim())
        .filter((constraint) => constraint !== "");
    
    if(cleanConstraints.length === 0){
        throw new Error('At least provide 1 constraint');
    }
    return cleanConstraints;
}

const validateExecutionLimits = ({ timeLimit, memoryLimit } = {}) => {
    if (timeLimit === undefined || memoryLimit === undefined) {
        throw new Error("Both timeLimit and memoryLimit must be provided together.");
    }

   
    const parsedTime = parseFloat(timeLimit);
    if (isNaN(parsedTime) || parsedTime < 1.0 || parsedTime > 5.0) {
        throw new Error("Time limit must be a float value between 1.0 and 5.0 seconds.");
    }

   
    const parsedMemory = parseInt(memoryLimit, 10);
    if (isNaN(parsedMemory) || parsedMemory < 16384 || parsedMemory > 1048576) {
        throw new Error("Memory limit must be an integer between 16384 KB (16MB) and 1048576 KB (1GB).");
    }

    return {
        timeLimit: Number(parsedTime.toFixed(3)), 
        memoryLimit: parsedMemory
    };
};

const validateVisibleTestCases = (visibleTestCases) => {
    if(!Array.isArray(visibleTestCases) || visibleTestCases.length === 0){
        throw new Error("Provide atleast one visible test case!");
    }

    const cleanData = visibleTestCases.map(({input, output, explanation}) => {
        if(!input || typeof input !== "string"){
            throw new Error("Invalid visible test case input!");
        }
        if(!output || typeof output !== "string"){
            throw new Error("Invalid visible test case output!");
        }
        if(explanation && typeof explanation !== "string"){
            throw new Error("Provide valid explanation for visible test case!");
        }

        return{
            input,
            output,
            explanation: (explanation) ? explanation.trim() : ""
        };
    })

    return cleanData;
}

const validateHiddenTestCases = (hiddenTestCases) => {
    if(!Array.isArray(hiddenTestCases) || hiddenTestCases.length === 0){
        throw new Error("Provide atleast one hidden test case!");
    }

    const cleanData = hiddenTestCases.map(({input, output, explanation}) => {
        if(!input || typeof input !== "string"){
            throw new Error("Invalid hidden test case input!");
        }
        if(!output || typeof output !== "string"){
            throw new Error("Invalid hidden test case output!");
        }

        return{
            input,
            output,
        };
    })

    return cleanData;
}

const validateReferenceSolution = async (referenceSolution) => {
    if (!Array.isArray(referenceSolution) || referenceSolution.length === 0) {
        throw new Error('At least one reference solution should be provided!');
    }

    const cleanData = referenceSolution.map(({ languageId, code }) => {
        if (!languageId || typeof languageId !== 'string' || !mongoose.Types.ObjectId.isValid(languageId)) {
            throw new Error('Missing or Invalid language identifier format!');
        }

        if (!code || typeof code !== 'string') {
            throw new Error('Missing or Invalid reference solution code!');
        }

        return {
            languageId: new mongoose.Types.ObjectId(languageId),
            code
        };
    });


    const uniqueIdsStrings = [...new Set(cleanData.map(t => t.languageId.toString()))];
    
    const existingCount = await Language.countDocuments({
        _id: { $in: uniqueIdsStrings }, 
    });

    if (uniqueIdsStrings.length !== existingCount) {
        throw new Error("One or more selected languages do not exist or multiple solution with in same language are sent.");
    }

    return cleanData;
};

const validateEditorial = async (editorial) => {
    if (!Array.isArray(editorial)) {
        throw new Error('Invalid editorial format! Editorial must be an array of approaches.');
    }

    if (editorial.length === 0) {
        return undefined; 
    }

    const allLanguageIdStrings = new Set();

    const cleanedEditorial = editorial.map(({ title, description, complexityAnalysis, codeImplementations }) => {
        if (!title || typeof title !== "string") {
            throw new Error('Invalid title for an editorial approach!');
        }
        const trimmedTitle = title.trim();
        if (!validator.isLength(trimmedTitle, { min: 3, max: 50 })) {
            throw new Error(`Approach title "${trimmedTitle}" must be between 3 and 50 characters.`);
        }

        // 2. Validate Description
        if (!description || typeof description !== "string") {
            throw new Error(`Invalid description for approach "${trimmedTitle}".`);
        }
        const trimmedDescription = description.trim();
        if (trimmedDescription.length < 10) {
            throw new Error(`Description for "${trimmedTitle}" must be at least 10 characters long.`);
        }

        // 3. Validate Complexity Metrics
        if (!complexityAnalysis || !complexityAnalysis.time || typeof complexityAnalysis.time !== "string") {
            throw new Error(`Time complexity missing or invalid in approach "${trimmedTitle}".`);
        }
        if (!complexityAnalysis.space || typeof complexityAnalysis.space !== "string") {
            throw new Error(`Space complexity missing or invalid in approach "${trimmedTitle}".`);
        }

        const trimmedTime = complexityAnalysis.time.trim();
        const trimmedSpace = complexityAnalysis.space.trim();

        if (trimmedTime.length === 0 || trimmedSpace.length === 0) {
            throw new Error(`Complexity metrics cannot be empty in approach "${trimmedTitle}".`);
        }

        // 4. Validate Code Implementations Array
        if (!Array.isArray(codeImplementations) || codeImplementations.length === 0) {
            throw new Error(`Approach "${trimmedTitle}" must contain at least one code implementation.`);
        }

        // Track duplicate languages within the SAME approach
        const approachLanguageSet = new Set();

        const cleanedCodeImplementations = codeImplementations.map(({ languageId, code }) => {
            const langStr = languageId?.toString();

            if (!langStr || typeof langStr !== 'string' || !mongoose.Types.ObjectId.isValid(langStr)) {
                throw new Error(`Invalid language selection inside approach "${trimmedTitle}".`);
            }

            if (!code || typeof code !== 'string' || code.trim().length === 0) {
                throw new Error(`Code implementation cannot be empty inside approach "${trimmedTitle}".`);
            }

            // Check for duplicate languages inside the same approach
            if (approachLanguageSet.has(langStr)) {
                throw new Error(`Duplicate language detected in approach "${trimmedTitle}". Each language can only have one implementation per approach.`);
            }
            approachLanguageSet.add(langStr);

            // Track globally for database batch lookup
            allLanguageIdStrings.add(langStr);

            return {
                languageId: new mongoose.Types.ObjectId(langStr),
                code: code 
            };
        });

        return {
            title: trimmedTitle,
            description: trimmedDescription,
            complexityAnalysis: {
                time: trimmedTime,
                space: trimmedSpace
            },
            codeImplementations: cleanedCodeImplementations
        };
    });

    // 5. Database verification for all referenced language IDs
    if (allLanguageIdStrings.size > 0) {
        const uniqueLanguageIds = [...allLanguageIdStrings];
        const existingCount = await Language.countDocuments({
            _id: { $in: uniqueLanguageIds }
        });

        if (uniqueLanguageIds.length !== existingCount) {
            throw new Error("One or more languages attached to the editorial code implementations do not exist in the database.");
        }
    }

    // Fixed return statement matching your schema directly
    return cleanedEditorial;
};

module.exports = {validateTitle, validateDescription, validateDifficulty, validateConstraints, validateEditorial, validateReferenceSolution, validateTags, validateExecutionLimits, validateVisibleTestCases, validateHiddenTestCases};