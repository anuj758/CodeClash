const {
    validateTitle,
    validateDescription,
    validateDifficulty,
    validateTags,
    validateConstraints,
    validateExecutionLimits,
    validateVisibleTestCases,
    validateHiddenTestCases,
    validateReferenceSolution,
    validateEditorial
} = require('../models/validators/problem');
const Language = require('../models/Language');
const { isAccepted } = require('./judge');

const prepareAndValidateProblem = async (body, userId) => {
    // 1. Validate all inputs
    const problemData = {
        title: validateTitle(body.title),
        description: validateDescription(body.description),
        difficulty: validateDifficulty(body.difficulty),
        tags: await validateTags(body.tags),
        constraints: validateConstraints(body.constraints),
        visibleTestCases: validateVisibleTestCases(body.visibleTestCases),
        hiddenTestCases: validateHiddenTestCases(body.hiddenTestCases),
        referenceSolution: await validateReferenceSolution(body.referenceSolution),
        executionLimits: validateExecutionLimits(body.executionLimits),
        editorial: (await validateEditorial(body.editorial)) || []
    };

    // Combine all test cases for validation
    const allTestCases = [...problemData.visibleTestCases, ...problemData.hiddenTestCases];
    const input = allTestCases.map(tc => tc.input);
    const expected_output = allTestCases.map(tc => tc.output);

    // 2. Validate reference solution codes against all test cases on Judge0
    for (const solution of problemData.referenceSolution) {
        const { code, languageId } = solution;

        const langDoc = await Language.findById(languageId).select('judge0LanguageId name');
        if (!langDoc) {
            throw new Error(`Language ID ${languageId} not found.`);
        }

        const judgeInput = {
            source_code: code, 
            judge0LanguageId: langDoc.judge0LanguageId,
            input,
            expected_output,
            timeLimit: problemData.executionLimits.timeLimit,
            memoryLimit: problemData.executionLimits.memoryLimit
        };

        const result = await isAccepted(judgeInput);
        if (!result.isAccepted) {
            const statusMessage = result.status?.description || 'Failed execution';
            throw new Error(`Reference solution for language "${langDoc.name || languageId}" failed: ${statusMessage}`);
        }
    }

    return problemData;
};

module.exports = prepareAndValidateProblem;