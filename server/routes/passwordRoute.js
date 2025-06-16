const express = require('express');
const router = express.Router(); // ✅ Define router BEFORE using it
const Admin = require('../models/Admin');
const Streamer = require('../models/Streamer');

// POST /api/password/verify-password
router.post('/verify-password', async (req, res) => {
  const { username, userType, currentPassword } = req.body;

  try {
    const Model = userType === 'admin' ? Admin : Streamer;
    const user = await Model.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentPassword !== user.password) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    res.status(200).json({ message: 'Password verified.' });
  } catch (err) {
    console.error('Password verification error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/password/update-password
router.post('/update-password', async (req, res) => {
  const { username, userType, newPassword } = req.body;

  try {
    const Model = userType === 'admin' ? Admin : Streamer;
    const user = await Model.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;