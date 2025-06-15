const mongoose = require('mongoose');

const StreamerSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: { type: String, default: 'streamer' },
  status: { type: String, default: 'Active' } 
  // resetToken: String,
  // tokenExpiry: Date,
});

module.exports = mongoose.model('Streamer', StreamerSchema, 'streamer');
