const express = require('express');
const router = express.Router(); 
const bcrypt = require('bcrypt');

const Admin = require('../models/Admin');       
const Streamer = require('../models/Streamer'); 

// Verify current password
// router.post('/verify-password', async (req, res) => {
//   const { username, currentPassword, userType } = req.body;

//   const Model = userType === 'admin' ? Admin : Streamer;
//   const user = await Model.findOne({ username });

//   if (!user) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   const isMatch = currentPassword === user.password; // if no hash
//   if (!isMatch) {
//     return res.status(401).json({ error: 'Incorrect current password' });
//   }

//   res.json({ message: 'Password verified' });
// });

// // Change to new password
// router.post('/change-password', async (req, res) => {
//   const { username, currentPassword, newPassword, userType } = req.body;

//   try {
//     const Model = userType === 'admin' ? Admin : Streamer;
//     const user = await Model.findOne({ username });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // If passwords are not hashed:
//     if (user.password !== currentPassword) {
//       return res.status(401).json({ error: 'Current password is incorrect' });
//     }

//     // Update to new password
//     user.password = newPassword;
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (err) {
//     console.error('Change error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


module.exports = router;
