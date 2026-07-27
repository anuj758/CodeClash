const express = require("express");
const verifyJWT = require('../middleware/verifyJWT');
const userRouter = express.Router();
const {getProfile, updateLikeDislike,
    getUserInteraction, updateProfile, getProblemSubmissions,
    getRecentSubmissions,
    getSubmissionById}= require('../controllers/user');

userRouter.use(verifyJWT);

userRouter.get('/profile/:username', getProfile);
userRouter.patch('/problem', updateLikeDislike);
userRouter.patch('/update', updateProfile);
userRouter.get('/problem/:problemNumber', getProblemSubmissions);
userRouter.get('/recent/:username', getRecentSubmissions);
userRouter.get('/detail/:submissionId', getSubmissionById);
userRouter.post('/interaction/:problemNumber/:status', updateLikeDislike);
userRouter.get('/interaction/:problemNumber', getUserInteraction);

module.exports = userRouter;