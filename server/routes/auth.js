const express = require('express');
const router = express.Router(); // ✅ Define router BEFORE using it
const Admin = require('../models/Admin');
const Streamer = require('../models/Streamer');


const bcrypt = require('bcrypt');


// GET all streamers
router.get('/users/streamer', async (req, res) => {
  try {
    const streamers = await Streamer.find(); // Fetch all streamer users
    res.json(streamers);
  } catch (err) {
    console.error('Failed to get streamers:', err);
    res.status(500).json({ error: 'Server error while fetching streamers' });
  }
});




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

        // check if the user is suspended
        if (user.status === 'Suspended') {
          return res.status(403).json({ error: 'Account is suspended.' });
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

// Requesting password reset
router.post('/request-password-reset', async (req, res) => {
  console.log("✅ USING CORRECT ROUTE: ", req.body);
  const { email } = req.body;

  try {
    const models = [Admin, Streamer];
    let user = null;
    let matchedModel = null;

    for (const Model of models) {
      user = await Model.findOne({ email });
      if (user) {
        matchedModel = Model;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'No user with that email' });
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    user.resetToken = token;
    user.tokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password-form?token=${token}`;

    const transporter = require('nodemailer').createTransport({
      service: 'Gmail',
      auth: {
        user: 'cineit.helpdesk@gmail.com',
        pass: 'xnba wevp gvgo irpg',
      },
    });

    await transporter.sendMail({
      from: '"Cine It Support" <cineit.helpdesk@gmail.com>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    res.json({ message: 'Reset link sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const models = [Admin, Streamer];
    let user = null;

    console.log("✅ Incoming reset-password request:", req.body);

    const { token, password } = req.body;
    console.log("Token received:", token);
    console.log("Current time:", Date.now());


    for (const Model of models) {
      user = await Model.findOne({
        resetToken: token,
        tokenExpiry: { $gt: Date.now() },
      });
      if (user) break;
    }

    console.log("Searching token:", token);
    console.log("Now:", Date.now());
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetToken = undefined;
    user.tokenExpiry = undefined;

    await user.save();
    console.log("✅ Token saved for user:", user);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Update streamer status
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await Streamer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});


module.exports = router;
