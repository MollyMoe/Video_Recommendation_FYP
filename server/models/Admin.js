const mongoose = require('mongoose');
const Counter = require('./Counter'); 

const AdminSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  username: String,
  password: String,
  email: String,
  fullName: String,
  userType: { type: String, default: 'admin' },
  profileImage: { type: String, default: "/uploads/profile.png" }

});

AdminSchema.pre("save", async function (next) {
  if (!this.userId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "adminId" }, 
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.userId = "A" + counter.sequence_value.toString().padStart(3, "0"); 
  }
  next();
});

module.exports = mongoose.model('Admin', AdminSchema, 'admin');
