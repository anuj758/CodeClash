const express = require("express");
const verifyJWT = require('../middleware/verifyJWT');
const userRouter = express.Router();
const {getProfile, updateLikeDislike,
    getUserInteraction, updatePhoto, getProblemSubmissions,
    getRecentSubmissions,
    getSubmissionById, updateBio}= require('../controllers/user');

const { upload } = require('../config/cloudinary.js');


userRouter.use(verifyJWT);

userRouter.get('/profile/:username', getProfile);
userRouter.patch('/problem', updateLikeDislike);
userRouter.get('/problem/:problemNumber', getProblemSubmissions);
userRouter.get('/recent/:username', getRecentSubmissions);
userRouter.get('/detail/:submissionId', getSubmissionById);
userRouter.post('/interaction/:problemNumber/:status', updateLikeDislike);
userRouter.get('/interaction/:problemNumber', getUserInteraction);
userRouter.patch('/profile/bio', updateBio);
userRouter.patch('/profile/photo', upload.single('photo'), updatePhoto);

module.exports = userRouter;