const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Admin = require("../models/Admin");
const Streamer = require("../models/Streamer");

// Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // upload path
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

//PUT route for uploading profile pic 
router.put("/upload/:userType/:userId", upload.single("profileImage"), async (req, res) => {
    console.log("req.file:", req.file);  // <-- Add this
  const { userType, userId } = req.params;
  const filePath = `/uploads/${req.file.filename}`; 

  const Model = userType === "admin" ? Admin : Streamer;

  try {
    const user = await Model.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.profileImage = filePath; // <-- Save path to MongoDB
    await user.save();

    res.json({ message: "Profile image updated", profileImage: filePath });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/streamers/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const streamer = await Streamer.findById(id);
      if (!streamer) return res.status(404).json({ error: 'User not found' });
      res.json(streamer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch streamer' });
    }
  });
  

module.exports = router;
