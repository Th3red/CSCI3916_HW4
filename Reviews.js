const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema


const reviewSchema = new mongoose.Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    username: String,
    review: String,
    rating: { type: Number, min: 0, max: 5 }
  });
  
  
// return the model
module.exports = mongoose.model('Review', reviewSchema);