const express = require("express");
const router = express.Router();
const Streamer = require('../models/Streamer');

 router.post("/genre", async (req, res) => {
  console.log("Received body:", req.body); 

  const { username, genres } = req.body;

  if (!username || !genres) {
    return res.status(400).json({ error: "Missing userId or genres" });
  }

  try {
    const user = await Streamer.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.genres = genres;
    await user.save();

    res.status(200).json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;