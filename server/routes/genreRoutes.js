const express = require("express");
const router = express.Router();
const Streamer = require("../models/Streamer");

router.post('/genre', async (req, res) => {
  const { username, genres } = req.body;

  if (!username || !genres || !Array.isArray(genres)) {
    return res.status(400).json({ error: 'username and genres are required' });
  }

  try {
    const user = await Streamer.findOneAndUpdate(
      { username },
      { genres },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Preferences updated', user });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;