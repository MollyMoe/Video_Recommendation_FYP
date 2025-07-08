// const mongoose = require('mongoose');

// const MovieSchema = new mongoose.Schema({
//   userId: String,
//   movieId: String,
//   predicted_rating: Number,
//   title: String,
//   genres: [String],
//   tmdb_id: String,
//   poster_url: String,
//   trailer_key: String,
//   trailer_url: String,
// }, { timestamps: true });


// module.exports = (conn) => conn.model('Movie', MovieSchema, 'hybridRecommendation');

const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  movieId: Number,
  predicted_rating: Number,
  title: String,
  genres: String,
  tmdb_id: Number,
  poster_url: String,
  trailer_url: String,
  director: String,
  producers: String,
  actors: String,
  overview: String,
}, { timestamps: true });


module.exports = (conn) => conn.model('Movie', MovieSchema, 'hybridRecommendation2');
