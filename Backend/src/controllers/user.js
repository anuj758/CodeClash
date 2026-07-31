const User = require('../models/User');
const ProblemInteraction = require('../models/ProblemInteraction');
const mongoose = require('mongoose');
const {validateUserName} = require('../models/validators/user');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const { uploadToCloudinary, cloudinary } = require('../config/cloudinary.js');

const getProfile = async (req, res) => {
    try {
        const { username } = req.params;
        
        let cleanUserName;
        try{
            cleanUserName = validateUserName(username);
        }
        catch(err){
            return res.status(400).json({message: 'Invalid or missing username'});
        }
        
        const user = await User.findOne({username: cleanUserName}).select('-password -isVerified -emailId -role -profileImage.public_id -createdAt -updatedAt -__v -_id');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

    
        const userRankScore = user.stats.rankScore;
        
        
        const usersAhead = await User.countDocuments({ 'stats.rankScore': { $gt: userRankScore } });
        const rank = usersAhead + 1;
        
        
        return res.status(200).json({
            success: true,
            profile: {
                ...user.toObject(),
                rank
            }
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getProblemSubmissions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problemNumber } = req.params;

        // Parse problemNumber
        const parsedNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid problem number.'
            });
        }

        // Find corresponding Problem document
        const problem = await Problem.findOne({ problemNumber: parsedNumber }).select('_id');
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found.'
            });
        }

        // Fetch submissions sorted by most recent
        const submissions = await Submission.find({
            userId,
            problemId: problem._id
        })
            .populate('languageId', 'name version monacoLanguage')
            .select('status code time memory acceptedTestCases totalTestCases createdAt')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: submissions.length,
            submissions
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch problem submissions',
            error: err.message
        });
    }
};


const getRecentSubmissions = async (req, res) => {
    try {
        const { username } = req.params;
        const limit = parseInt(req.query.limit, 10) || 10;

        // Find target user
        const targetUser = await User.findOne({ username: username.toLowerCase() }).select('_id username');
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Fetch recent submissions with problem title & language info
        const recentSubmissions = await Submission.find({ userId: targetUser._id })
            .populate('problemId', 'problemNumber title difficulty')
            .populate('languageId', 'name version')
            .select('status time memory createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            count: recentSubmissions.length,
            submissions: recentSubmissions
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recent submissions',
            error: err.message
        });
    }
};


const getSubmissionById = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const currentUserId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission ID format.'
            });
        }

        const submission = await Submission.findById(submissionId)
            .populate('problemId', 'problemNumber title difficulty executionLimits')
            .populate('languageId', 'name version monacoLanguage')
            .populate('userId', 'username name profileImage')
            .lean();

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found.'
            });
        }

        // Access Guard: Allow viewing if submission belongs to logged-in user OR user is admin
        const isOwner = currentUserId && submission.userId._id.toString() === currentUserId.toString();
        const isAdmin = req.user?.role === 'admin';

        if (!isOwner && !isAdmin) {
            // Mask failed test details for privacy if viewing someone else's submission
            delete submission.failedTestCase;
        }

        return res.status(200).json({
            success: true,
            submission
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch submission detail',
            error: err.message
        });
    }
};


const updateLikeDislike = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problemNumber, status } = req.params;

        // 1. Validate status param
        if (!status || !['like', 'dislike'].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Status must be either 'like' or 'dislike'."
            });
        }

        const targetStatus = status.toLowerCase() === 'like' ? 'liked' : 'disliked';

        // 2. Validate problem exists
        const parsedNumber = parseInt(problemNumber, 10);
        if (isNaN(parsedNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid problem number."
            });
        }

        const problem = await Problem.findOne({ problemNumber: parsedNumber });
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found."
            });
        }

        // 3. Find existing user interaction or initialize a new one
        let interaction = await ProblemInteraction.findOne({
            userId,
            problemId: problem._id
        });

        if (!interaction) {
            interaction = new ProblemInteraction({
                userId,
                problemId: problem._id,
                status: 'none'
            });
        }

        const prevStatus = interaction.status;

        // 4. Calculate diffs for Problem counts
        let likeDiff = 0;
        let dislikeDiff = 0;

        if (prevStatus === targetStatus) {
            // Case A: User clicked the same button again -> Toggle back to 'none' (Unvote)
            interaction.status = 'none';
            if (targetStatus === 'liked') likeDiff = -1;
            if (targetStatus === 'disliked') dislikeDiff = -1;
        } else {
            // Case B: User is changing vote (e.g. none -> liked, or disliked -> liked)
            interaction.status = targetStatus;

            // Remove previous vote if any
            if (prevStatus === 'liked') likeDiff -= 1;
            if (prevStatus === 'disliked') dislikeDiff -= 1;

            // Add new vote
            if (targetStatus === 'liked') likeDiff += 1;
            if (targetStatus === 'disliked') dislikeDiff += 1;
        }

        // 5. Save interaction and update problem counters safely
        await interaction.save();

        const updatedProblem = await Problem.findByIdAndUpdate(
            problem._id,
            {
                $inc: {
                    likes: likeDiff,
                    dislikes: dislikeDiff
                }
            },
            { new: true, runValidators: true }
        ).select('likes dislikes problemNumber');

        return res.status(200).json({
            success: true,
            message: `Successfully updated interaction to ${interaction.status}`,
            userStatus: interaction.status,
            likes: updatedProblem.likes,
            dislikes: updatedProblem.dislikes
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to process reaction",
            error: err.message
        });
    }
};


const getUserInteraction = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problemNumber } = req.params;

        const problem = await Problem.findOne({ problemNumber: parseInt(problemNumber, 10) }).select('_id');
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        const interaction = await ProblemInteraction.findOne({
            userId,
            problemId: problem._id
        }).lean();

        return res.status(200).json({
            success: true,
            status: interaction?.status || 'none'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve interaction state',
            error: err.message
        });
    }
};

const updatePhoto = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }
    
    const user = req.user;

    if (user.profileImage.publicId) {
      await cloudinary.uploader.destroy(user.profileImage.publicId);
    }
    

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'codeclash_user_profile_photo');


    user.profileImage.url = cloudinaryResult.secure_url;
    user.profileImage.publicId = cloudinaryResult.public_id; 

    await user.save();

    
    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      avatarUrl: user.avatarUrl,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBio = async (req, res) => {
    try {
        const { bio } = req.body;

        if (!bio || typeof bio !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid Bio' });
        }

        const user = req.user;
        if(user.bio !== bio.trim()){
            user.bio = bio.trim();
            await user.save();
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Bio updated successfully',
            bio: user.bio 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {getProfile, updateLikeDislike,
    getUserInteraction, updatePhoto, getProblemSubmissions,
    getRecentSubmissions,
    getSubmissionById, updateBio};
