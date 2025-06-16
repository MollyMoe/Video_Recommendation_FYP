const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,              // e.g. "streamerId"
  sequence_value: Number   // holds the last used number
});

module.exports = mongoose.model('Counter', counterSchema);
