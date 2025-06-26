const express = require('express');
const {
    getAllUsers,
    getUserProfile,
    updateUserProfile
} = require('../controllers/user.controller');

const router = express.Router();

router.route('/').get(getAllUsers);

router.route('/:id/profile')
    .get(getUserProfile)
    .put(updateUserProfile);

module.exports = router;
