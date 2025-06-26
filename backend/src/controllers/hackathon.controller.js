const Hackathon = require('../models/Hackathon');
const CoHost = require('../models/CoHost');

// @desc    Create a new hackathon
// @route   POST /api/hackathons
// @access  Private (to be implemented)
exports.createHackathon = async (req, res) => {
  try {
    // Assuming organizer's ID is available from a future auth middleware
    // const organizer_id = req.user.id;
    const hackathon = await Hackathon.create({ ...req.body /*, organizer_id */ });
    res.status(201).json({ success: true, data: hackathon });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
exports.getAllHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find().populate('organizer_id', 'name email');
    res.status(200).json({ success: true, count: hackathons.length, data: hackathons });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get a single hackathon by ID
// @route   GET /api/hackathons/:id
// @access  Public
exports.getHackathonById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id).populate('organizer_id', 'name email');
    if (!hackathon) {
      return res.status(404).json({ success: false, error: 'Hackathon not found' });
    }
    res.status(200).json({ success: true, data: hackathon });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update a hackathon
// @route   PUT /api/hackathons/:id
// @access  Private
exports.updateHackathon = async (req, res) => {
  try {
    let hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      return res.status(404).json({ success: false, error: 'Hackathon not found' });
    }
    // Add check for ownership/authorization here later
    hackathon = await Hackathon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: hackathon });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      return res.status(404).json({ success: false, error: 'Hackathon not found' });
    }
    // Add check for ownership/authorization here later
    await hackathon.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add a co-host to a hackathon
// @route   POST /api/hackathons/:id/cohosts
// @access  Private
exports.addCoHost = async (req, res) => {
    try {
        const { userId } = req.body;
        const hackathonId = req.params.id;

        const hackathon = await Hackathon.findById(hackathonId);
        if (!hackathon) {
            return res.status(404).json({ success: false, error: 'Hackathon not found' });
        }

        // Add authorization check here later

        const coHost = await CoHost.create({ hackathon_id: hackathonId, user_id: userId });
        res.status(201).json({ success: true, data: coHost });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
