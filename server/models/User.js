const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: String,
});

module.exports = mongoose.model('User', UserSchema);
