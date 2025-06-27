const User = require('../models/User');
const Profile = require('../models/Profile');

// @desc    Get all users
// @route   GET /api/users
// @access  Public (for now, should be Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get a single user's profile
// @route   GET /api/users/:id/profile
// @access  Public (for now)
exports.getUserProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user_id: req.params.id }).populate('user_id', 'name email plan');
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update a user's profile
// @route   PUT /api/users/:id/profile
// @access  Private (to be implemented)
exports.updateUserProfile = async (req, res) => {
    try {
        // Later, we'll get user ID from req.user.id after authentication
        const profile = await Profile.findOneAndUpdate({ user_id: req.params.id }, req.body, {
            new: true,
            runValidators: true,
        });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
