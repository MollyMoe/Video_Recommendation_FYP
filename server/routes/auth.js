const express = require('express');
const Admin = require('../models/Admin');
const Streamer = require('../models/Streamer');

const router = express.Router();

// SIGNUP — plain password
router.post('/signup', async (req, res) => {
  const { fullName, username, email, password, userType } = req.body;

  try {
    const Model = userType === 'admin' ? Admin : Streamer;

    const existingUser = await Model.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = new Model({ fullName, username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const userType = req.body.userType?.toLowerCase(); // normalize

  console.log('Sign-in request received:', req.body);

  try {
    const Model = userType === 'admin' ? Admin : Streamer;

    const user = await Model.findOne({ username });

    console.log(`Finding user in: ${userType}`);
    console.log(`Login attempt → Username: ${username} | DB Password: ${user?.password} | Entered: ${password}`);

    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    return res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user by username
router.delete('/delete/:userType/:username', async (req, res) => {
  const { userType, username } = req.params;
  const Model = userType === 'admin' ? Admin : Streamer;

  try {
    const deletedUser = await Model.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
