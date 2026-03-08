const express = require('express');
const router = express.Router();
const controller = require('../controllers/applications.controller');
router.get('/', controller.getAllApplications);
router.post('/', controller.createApplication);
router.put('/:id', controller.updateApplication);
router.delete('/:id', controller.deleteApplication);
module.exports = router;
