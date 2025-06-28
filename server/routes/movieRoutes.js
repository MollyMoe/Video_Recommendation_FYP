const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const movieConnection = mongoose.createConnection(process.env.MOVIE_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const getMovieModel = require("../models/Movie"); 
const Movie = getMovieModel(movieConnection); 

router.get("/all", async (req, res) => {
  try {
    const count = await Movie.countDocuments();
    const randomSkip = Math.floor(Math.random() * Math.max(0, count - 20)); // pick a different start each time
    const allMovies = await Movie.find().skip(randomSkip).limit(20); // fetch a randoom 20 movies from entire collection each time, regardless of limit
    res.json(allMovies);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});


module.exports = router;
