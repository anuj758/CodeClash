const express = require('express');
const metaRouter = express.Router();
const {getAllLanguages, getAllTags} = require('../controllers/meta');


metaRouter.get('/tags', getAllTags);
metaRouter.get('/languages', getAllLanguages);

module.exports = metaRouter;