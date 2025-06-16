const mongoose = require('mongoose');
const Counter = require('./Counter'); 

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: { type: String, default: 'admin' },
});

AdminSchema.pre("save", async function (next) {
  if (!this.shortId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "adminId" }, // 🔑 Unique counter for admin
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.shortId = "A" + counter.sequence_value.toString().padStart(3, "0"); // like A001, A002
  }
  next();
});

module.exports = mongoose.model('Admin', AdminSchema, 'admin');
