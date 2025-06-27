const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');

const router = express.Router();

// Later, add an auth middleware here to protect the route
router.get('/', getAnalytics);

module.exports = router;
