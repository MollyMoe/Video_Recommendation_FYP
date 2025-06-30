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
    const allMovies = await Movie.find().limit(25000).lean();
    res.json(allMovies);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});


module.exports = router;