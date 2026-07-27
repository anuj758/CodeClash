const express = require('express');
const {
    promoteUserToAdmin,
    demoteAdminToUser,
    createProblem,
    getProblemAllData,
    deleteProblem,
    updateProblem,
    addLanguage,
    deleteLanguage,
    addTag,
    deleteTag,
    createProblemsBatch
} = require('../controllers/admin');

const { verifyAdmin } = require('../middleware/verifyRole');
const verifyJWT = require('../middleware/verifyJWT');

const adminRouter = express.Router();

// Apply global authentication & admin authorization middleware
adminRouter.use(verifyJWT, verifyAdmin);

// User Role Management
adminRouter.put('/promote', promoteUserToAdmin);
adminRouter.put('/demote', demoteAdminToUser);

// Problem Management 
adminRouter.post('/problems', createProblem);
adminRouter.put('/problems/:problemNumber', updateProblem);
adminRouter.delete('/problems/:problemNumber', deleteProblem);
adminRouter.get('/problems/:problemNumber', getProblemAllData); 

// Metadata Management
adminRouter.post('/tags', addTag);       
adminRouter.delete('/tags', deleteTag);

adminRouter.post('/languages', addLanguage);  
adminRouter.delete('/languages', deleteLanguage);

adminRouter.post('/problems/batch', createProblemsBatch)

module.exports = adminRouter;