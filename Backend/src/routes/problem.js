const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const {getProblems, submitSolution, runSolution, getProblemByNumber} = require('../controllers/problem');

const problemRouter = express.Router();

problemRouter.use(verifyJWT);

problemRouter.get('/', getProblems); 
problemRouter.get('/:problemNumber', getProblemByNumber); 
problemRouter.post('/submit/:problemNumber', submitSolution);
problemRouter.post('/run/:problemNumber', runSolution);

module.exports = problemRouter;