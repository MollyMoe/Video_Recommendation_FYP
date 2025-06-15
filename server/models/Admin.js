const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: { type: String, default: 'admin' },
});

module.exports = mongoose.model('Admin', AdminSchema, 'admin');
