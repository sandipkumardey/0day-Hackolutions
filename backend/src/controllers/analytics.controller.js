const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');

// @desc    Get platform-wide analytics
// @route   GET /api/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHackathons = await Hackathon.countDocuments();
        const totalRegistrations = await Registration.countDocuments();

        const userPlanBreakdown = await User.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]);

        const analyticsData = {
            totalUsers,
            totalHackathons,
            totalRegistrations,
            userPlanBreakdown
        };

        res.status(200).json({ success: true, data: analyticsData });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
