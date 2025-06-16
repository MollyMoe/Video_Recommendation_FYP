// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Streamer = require('../models/Streamer');

// Update profile image (for both admin and streamer)
router.put('/users/:id/profile-image', async (req, res) => {
  const { id } = req.params;
  const { profileImage } = req.body;

  try {
    // Try finding user in both collections
    let user = await Admin.findById(id);
    if (!user) user = await Streamer.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profileImage = profileImage;
    await user.save();

    res.json({ message: 'Profile image updated', profileImage });
  } catch (err) {
    console.error('Profile image update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
