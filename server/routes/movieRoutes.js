// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");

// const movieConnection = mongoose.createConnection(process.env.MOVIE_DB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const getMovieModel = require("../models/Movie"); 
// const Movie = getMovieModel(movieConnection); 

// router.get("/all", async (req, res) => {
//   try {
//     const allMovies = await Movie.find().limit(30000); //he added const allMovies = await Movie.find().limit(25000).lean();
//     res.json(allMovies);
//   } catch (err) {
//     console.error("Failed to fetch movies:", err);
//     res.status(500).json({ error: "Failed to fetch movies" });
//   }
// });


// module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const movieConnection = mongoose.createConnection(process.env.MOVIE_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const getMovieModel = require("../models/Movie"); 
const Movie = getMovieModel(movieConnection);

const Streamer = require("../models/Streamer"); 
const HybridRec = movieConnection.collection("hybridRecommendation2");

// GET all movies
router.get("/all", async (req, res) => {
  try {
    const allMovies = await Movie.find().limit(30000);
    res.json(allMovies);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// POST regenerate recommendations by username
router.post("/recommendations/regenerate/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await Streamer.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const preferredGenres = user.genres || [];

    if (!preferredGenres.length) {
      return res.status(400).json({ error: "User has no preferred genres" });
    }

    const recommendations = await HybridRec
      .find({ genres: { $in: preferredGenres } })
      .limit(100)
      .toArray();

    return res.status(200).json({
      message: "Recommendations regenerated",
      count: recommendations.length,
      recommendations,
    });

  } catch (err) {
    console.error("Failed to regenerate recommendations:", err);
    res.status(500).json({ error: "Server error while regenerating recommendations" });
  }
});

module.exports = router;
