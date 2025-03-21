const express = require('express');
const groupController = require('../controllers/groupController');
const router = express.Router();

router.post('/create', groupController.createGroup);
router.post('/join', groupController.joinGroup);

module.exports = router;