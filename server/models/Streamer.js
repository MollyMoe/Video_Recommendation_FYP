const mongoose = require('mongoose');
const Counter = require('./Counter');

const StreamerSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: { type: String, default: 'streamer' },
  status: { type: String, default: 'Active' } ,
  genres: [String],
  resetToken: String,
  tokenExpiry: Date,
  likedMovies: {
    type: [String],
    default: [],
  },
});


StreamerSchema.pre("save", async function (next) {
  if (!this.userId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "streamerId" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.userId = "U" + counter.sequence_value.toString().padStart(3, "0"); // like U001, U002
  }
  next();
});

module.exports = mongoose.model('Streamer', StreamerSchema, 'streamer');
