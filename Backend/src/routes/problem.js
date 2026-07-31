const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const {getProblems, submitSolution, runSolution, getProblemByNumber} = require('../controllers/problem');
const runSubmitRateLimiter = require('../middleware/runSubmitRateLimiter');
const problemRouter = express.Router();

problemRouter.use(verifyJWT);

problemRouter.get('/', getProblems); 
problemRouter.get('/:problemNumber', getProblemByNumber); 
problemRouter.post('/submit/:problemNumber', runSubmitRateLimiter, submitSolution);
problemRouter.post('/run/:problemNumber', runSubmitRateLimiter, runSolution);

module.exports = problemRouter;