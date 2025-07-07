

const express = require('express');
const router = express.Router();
const Streamer = require('../models/Streamer');
const Admin = require('../models/Admin') // adjust path if needed

//Streamer
router.put('/streamer/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username, genre } = req.body;

  try {
    const updatedUser = await Streamer.findOneAndUpdate(
      { userId }, // match by custom userId
      {
        $set: {
          username,
          genres: genre.split(',').map(g => g.trim()),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

//Admin
router.put('/admin/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username } = req.body;

  try {
    const updatedUser = await Admin.findOneAndUpdate(
      { userId }, // match by custom userId
      {
        $set: {
          username
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

module.exports = router;