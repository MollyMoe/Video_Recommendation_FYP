const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Admin = require("../models/Admin");
const Streamer = require("../models/Streamer");

// Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
 filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Upload profile image route
router.put("/upload/:userType/:userId", upload.single("profileImage"), async (req, res) => {
  console.log("✅ File received:", req.file);

  const { userType, userId } = req.params;
  const filePath = `uploads/${req.file.filename}`;

  const Model = userType === "admin" ? Admin : Streamer;

  try {
    const user = await Model.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profileImage = filePath;
    await user.save();

    console.log("✅ Profile image saved to DB:", filePath);
    res.json({ message: "Profile image updated", profileImage: filePath });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get streamer profile
router.get('/streamer/:userId', async (req, res) => {
  try {
    const streamer = await Streamer.findOne({ userId: req.params.userId }); // ✅ fix
    if (!streamer) return res.status(404).json({ error: 'Streamer not found' });
    res.json(streamer);
  } catch (err) {
    console.error("❌ Fetch streamer error:", err);
    res.status(500).json({ error: 'Failed to fetch streamer' });
  }
});

// ✅ Get admin profile
router.get('/admin/:userId', async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.params.userId }); // ✅ fix
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    console.error("❌ Fetch admin error:", err);
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});


module.exports = router;