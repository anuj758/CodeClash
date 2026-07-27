const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { chatWithAI } = require('../controllers/ai');

// POST /api/ai/chat
router.post('/chat', verifyJWT, chatWithAI);

module.exports = router;