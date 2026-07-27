const Language = require('../models/Language');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Tag = require('../models/Tag');
const { isAccepted, runAndCheck } = require('../utils/judge');
const User = require('../models/User');
const mongoose = require('mongoose');

const getProblems = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const { difficulty, tags, title, problemNumber, status } = req.query;
        const userId = req.user?._id;
        
        // 1. Fetch Solved & All Attempted problem IDs for the logged-in user
        let solvedProblemIds = [];
        let allAttemptedProblemIds = [];

        if (userId) {
            // Fetch both in parallel for optimal speed
            const [solvedIds, totalAttemptedIds] = await Promise.all([
                Submission.distinct('problemId', {
                    userId,
                    'status.description': 'Accepted'
                }),
                Submission.distinct('problemId', { userId })
            ]);

            solvedProblemIds = solvedIds;
            allAttemptedProblemIds = totalAttemptedIds;
        }

        const solvedSet = new Set(solvedProblemIds.map((id) => id.toString()));

        // Filter out solved IDs to isolate "attempted but not solved" problems
        const solvedStrSet = new Set(solvedProblemIds.map((id) => id.toString()));
        const attemptedOnlyProblemIds = allAttemptedProblemIds.filter(
            (id) => !solvedStrSet.has(id.toString())
        );

        // 2. Build Query Filters
        const filter = {};

        if (problemNumber && !isNaN(problemNumber)) {
            filter.problemNumber = parseInt(problemNumber, 10);
        }

        if (title && title.trim() !== '') {
            filter.title = { $regex: title.trim(), $options: 'i' };
        }

        if (difficulty && difficulty.trim() !== '') {
            filter.difficulty = difficulty.trim().toLowerCase();
        }

        // --- MULTI-TAG HANDLING ---
        if (tags) {
            let tagList = [];
            if (Array.isArray(tags)) {
                tagList = tags;
            } else if (typeof tags === 'string') {
                tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
            }

            if (tagList.length > 0) {
                const isObjectIdList = tagList.every((t) => mongoose.Types.ObjectId.isValid(t));
                let matchedTagIds = [];

                if (isObjectIdList) {
                    matchedTagIds = tagList.map((t) => new mongoose.Types.ObjectId(t));
                } else {
                    const regexPatterns = tagList.map((t) => new RegExp(t, 'i'));
                    const foundTags = await Tag.find({ name: { $in: regexPatterns } }).select('_id');
                    matchedTagIds = foundTags.map((t) => t._id);
                }

                if (matchedTagIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        totalProblems: 0,
                        currentPage: page,
                        totalPages: 0,
                        hasMore: false,
                        problems: []
                    });
                }

                filter.tags = { $in: matchedTagIds };
            }
        }

        // --- STATUS FILTERING (solved | attempted | unsolved) ---
        if (status === 'solved') {
            filter._id = { $in: solvedProblemIds };
        } else if (status === 'attempted') {
            // Submitted at least once, but NOT solved
            filter._id = { $in: attemptedOnlyProblemIds };
        } else if (status === 'unsolved') {
            // Never submitted by this user
            filter._id = { $nin: allAttemptedProblemIds };
        }

        // 3. Fetch raw problems from Database
        const [rawProblems, totalProblems] = await Promise.all([
            Problem.find(filter)
                .select('_id problemNumber title difficulty tags likes totalSubmissions totalAccepted')
                .populate('tags', 'name')
                .sort({ problemNumber: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Problem.countDocuments(filter)
        ]);

        // 4. Transform output & strip `_id` before returning to client
        const problems = rawProblems.map(({ _id, ...problem }) => ({
            ...problem,
            isSolved: solvedSet.has(_id.toString())
        }));

        const hasMore = skip + problems.length < totalProblems;

        return res.status(200).json({
            success: true,
            totalProblems,
            currentPage: page,
            totalPages: Math.ceil(totalProblems / limit),
            hasMore,
            problems
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error fetching problems",
            error: err.message
        });
    }
};

const getProblemByNumber = async (req, res) => {
    try {
        const { problemNumber } = req.params;
        const userId = req.user?._id; 

        // 1. Validate problemNumber
        const parsedProblemNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedProblemNumber)) {
            return res.status(400).json({
                success: false,
                message: "Problem number must be a valid integer"
            });
        }

        // 2. Find problem & populate languages + tags
        const problem = await Problem.findOne({ problemNumber: parsedProblemNumber })
            .populate('tags', 'name')
            .populate({
                path: 'referenceSolution.languageId',
                select: 'name version monacoLanguage defaultTemplate'
            })
            .lean();

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }
        
        // 3. User submission status
        let isSolved = false;
        let hasAttempted = false;

        if (userId) {
            const userSubmissions = await Submission.find({
                userId,
                problemId: problem._id
            })
            .select('status.description')
            .lean();

            if (userSubmissions.length > 0) {
                hasAttempted = true;
                isSolved = userSubmissions.some(
                    (sub) => sub.status?.description === 'Accepted'
                );
            }
        }

        // 4. Calculate acceptance rate
        const totalSubmissions = problem.totalSubmissions || 0;
        const totalAccepted = problem.totalAccepted || 0;
        const acceptanceRate = totalSubmissions > 0 
            ? parseFloat(((totalAccepted / totalSubmissions) * 100).toFixed(2)) 
            : 0;

        // 5. Supported languages 
        const supportedLanguages = (problem.referenceSolution || [])
            .filter((template) => template && template.languageId) 
            .map((template) => ({
                languageId: template.languageId._id,
                name: template.languageId.name,
                version: template.languageId.version, 
                monacoLanguage: template.languageId.monacoLanguage,
                initialCode: template.languageId.defaultTemplate || ""
            }));

        // 6. Return problem details
        return res.status(200).json({
            success: true,
            problem: {
                problemNumber: problem.problemNumber,
                title: problem.title,
                description: problem.description,
                tags: problem.tags,
                constraints: problem.constraints,
                executionLimits: problem.executionLimits,
                visibleTestCases: problem.visibleTestCases,
                totalSubmissions,
                totalAccepted,
                likes: problem.likes || 0,
                dislikes: problem.dislikes || 0,
                acceptanceRate,
                isSolved,
                hasAttempted,
                supportedLanguages,
                editorial: problem.editorial
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch problem details",
            error: err.message
        });
    }
};


const submitSolution = async (req, res) => {
    try {
        const { problemNumber } = req.params;
        const { code, languageId } = req.body;
        const userId = req.user._id;

        // 1. Validate route params and body fields
        const parsedProblemNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedProblemNumber)) {
            return res.status(400).json({ message: 'Invalid problem number!' });
        }

        if (!code || !languageId) {
            return res.status(400).json({ message: 'Missing required fields (code or languageId)!' });
        }

        // 2. Fetch Language, Problem, and User in parallel
        const [langDoc, problemDoc, userDoc] = await Promise.all([
            Language.findById(languageId).select('judge0LanguageId'),
            Problem.findOne({ problemNumber: parsedProblemNumber }).select('hiddenTestCases executionLimits difficulty'),
            User.findById(userId)
        ]);

        if (!langDoc) {
            return res.status(400).json({ message: 'Invalid Language ID!' });
        }

        if (!problemDoc || !problemDoc.hiddenTestCases) {
            return res.status(404).json({ message: 'Problem not found or missing test cases!' });
        }

        if (!userDoc) {
            return res.status(404).json({ message: 'User not found!' });
        }

        // 3. Construct payload and execute Judge0 via isAccepted
        const payload = {
            source_code: code,
            judge0LanguageId: langDoc.judge0LanguageId,
            input: problemDoc.hiddenTestCases.map(tc => tc.input),
            expected_output: problemDoc.hiddenTestCases.map(tc => tc.output),
            timeLimit: problemDoc.executionLimits.timeLimit,
            memoryLimit: problemDoc.executionLimits.memoryLimit
        };

        const judgeOutput = await isAccepted(payload);

        const isAcceptedStatus = judgeOutput.isAccepted;
        const failed = judgeOutput.failedTestCase;

        // 4. Create New Submission Document
        const newSubmission = new Submission({
            userId,
            problemId: problemDoc._id,
            languageId,
            code,
            status: judgeOutput.status,
            time: judgeOutput.time || 0,
            memory: judgeOutput.memory || 0,
            acceptedTestCases: judgeOutput.acceptedTestCases || 0,
            totalTestCases: judgeOutput.totalTestCases || problemDoc.hiddenTestCases.length,
            failedTestCase: failed ? {
                input: failed.input || null,
                expectedOutput: failed.expected_output || null,
                actualOutput: failed.actual_output || null
            } : { input: null, expectedOutput: null, actualOutput: null },
            compileOutput: failed?.compilationError || "",
            stderr: failed?.runTimeError || ""
        });

        // 5. Update User Stats & Check Previous Solved Status
        userDoc.stats.totalSubmissions += 1;

        if (isAcceptedStatus) {
            userDoc.stats.totalAccepted += 1;

            // Check directly in Submission collection if user already has an accepted submission for this problem
            const hasPreviouslySolved = await Submission.exists({
                userId,
                problemId: problemDoc._id,
                'status.id': 3
            });

            // If no prior accepted submission exists, treat this as the first-time solve
            if (!hasPreviouslySolved) {
                userDoc.stats.totalProblemSolved += 1;

                const diffKey = problemDoc.difficulty ? problemDoc.difficulty.toLowerCase() : 'easy';
                if (userDoc.stats.difficultyCount[diffKey] !== undefined) {
                    userDoc.stats.difficultyCount[diffKey] += 1;
                }
            }
        }

        // 6. Recalculate Rank Score
        const { beginner = 0, easy = 0, medium = 0, hard = 0 } = userDoc.stats.difficultyCount;
        const baseScore = (1 * beginner) + (3 * easy) + (8 * medium) + (20 * hard);
        
        const acceptanceRate = userDoc.stats.totalSubmissions > 0 
            ? (userDoc.stats.totalAccepted / userDoc.stats.totalSubmissions) * 100 
            : 0;

        userDoc.stats.rankScore = Math.round((baseScore + (acceptanceRate * baseScore) / 200) * 100) / 100;

        // 7. Atomic update object for Problem Document counters
        const problemIncUpdates = {
            totalSubmissions: 1
        };

        if (isAcceptedStatus) {
            problemIncUpdates.totalAccepted = 1;
        }

        // 8. Save Submission, User, and Problem updates concurrently
        await Promise.all([
            newSubmission.save(),
            userDoc.save(),
            Problem.findByIdAndUpdate(problemDoc._id, { $inc: problemIncUpdates })
        ]);

        return res.status(200).json({
            ...judgeOutput,
            submissionId: newSubmission._id
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const runSolution = async (req, res) => {
    try {
        const { problemNumber } = req.params;
        const { code, languageId, testCases } = req.body;

        // 1. Validate route params and required fields
        const parsedProblemNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedProblemNumber)) {
            return res.status(400).json({ message: 'Invalid problem number!' });
        }

        if (!code || !languageId || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ message: 'Missing required fields (code, languageId, or testCases)!' });
        }

        // 2. Fetch Language and Problem limits in parallel
        const [langDoc, problemDoc] = await Promise.all([
            Language.findById(languageId).select('judge0LanguageId'),
            Problem.findOne({ problemNumber: parsedProblemNumber }).select('executionLimits')
        ]);

        if (!langDoc) {
            return res.status(400).json({ message: 'Invalid Language ID!' });
        }

        if (!problemDoc) {
            return res.status(404).json({ message: 'Problem not found!' });
        }

        // 3. Construct payload for execution engine
        const judgeInput = {
            code,
            judge0LanguageId: langDoc.judge0LanguageId,
            input: testCases, // Array of test case input strings
            timeLimit: problemDoc.executionLimits?.timeLimit || 5.0,
            memoryLimit: problemDoc.executionLimits?.memoryLimit || 262144
        };

        // 4. Run user code against test cases
        const result = await runAndCheck(judgeInput);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {getProblems, getProblemByNumber, submitSolution, runSolution};